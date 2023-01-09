import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SplTransfer } from "../target/types/spl_transfer";
import { Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, MintLayout, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction } from "@solana/spl-token";
import { readFileSync } from "fs";
import { BN } from "bn.js";

describe("spl-transfer", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.SplTransfer as Program<SplTransfer>;
  const anchor_wallet = anchor.AnchorProvider.env().wallet;

  // setting the test wallets keypair
  console.log("Setting keypairs for Test Wallets!")
  const test_wallet_1_path = __dirname + '/../test_accounts/test_wallet_1.json'
  const test_wallet_2_path = __dirname + '/../test_accounts/test_wallet_2.json'
  const test_wallet_1_keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(test_wallet_1_path, "utf-8"))));
  const test_wallet_2_keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(test_wallet_2_path, "utf-8"))));
  console.log("Test Wallet 1 pubkey:", test_wallet_1_keypair.publicKey)
  console.log("Test Wallet 2 pubkey:", test_wallet_2_keypair.publicKey)
    __dirname
  it("Spl Transfer Test!!!", async () => {
    
    // generate keypair for mint
    const mint_keypair = anchor.web3.Keypair.generate();
    const mint_address = mint_keypair.publicKey;
    console.log("mint address:", mint_address)
    // instruction for creating mint account
    const mint_account_inx = anchor.web3.SystemProgram.createAccount({
        fromPubkey: anchor_wallet.publicKey,
        newAccountPubkey: mint_address,
        lamports: 1_000_000_000,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
    });
    // instruction for initializing mint account
    const mint_init_inx = createInitializeMintInstruction(
        mint_address,
        9,
        anchor_wallet.publicKey,
        anchor_wallet.publicKey
    );
    // get the ATA address of the test wallet 1
    const wallet_1_ata_address = await getAssociatedTokenAddress(
        mint_keypair.publicKey,
        test_wallet_1_keypair.publicKey
    );
    console.log("wallet_1_ata_address:", wallet_1_ata_address)
    //instruction for creating wallet 1 ATA
    const wallet_1_ata_inx = createAssociatedTokenAccountInstruction(
        test_wallet_1_keypair.publicKey,
        wallet_1_ata_address,
        test_wallet_1_keypair.publicKey,
        mint_address
    );
    // intruction for minting 100 tokens into test wallet 1's ata
    console.log("Forming instruction for minting 100 tokens into", wallet_1_ata_address)
    const mint_token_inx = createMintToInstruction(
        mint_address,
        wallet_1_ata_address,
        anchor_wallet.publicKey,
        100_000_000_000
    );
    // get the ATA address of the test wallet 2
    const wallet_2_ata_address = await getAssociatedTokenAddress(
        mint_keypair.publicKey,
        test_wallet_2_keypair.publicKey
    );
    console.log("wallet_2_ata_address:", wallet_2_ata_address)
    // instruction for creating wallet 2 ATA
    const wallet_2_ata_inx = createAssociatedTokenAccountInstruction(
        test_wallet_2_keypair.publicKey,
        wallet_2_ata_address,
        test_wallet_2_keypair.publicKey,
        mint_address
    )
    // add all 3 instruction to a transaction
    const tnx = new anchor.web3.Transaction().add(
        mint_account_inx,  // instruction for creating mint account
        mint_init_inx,     // instruction for initializing mint account
        wallet_1_ata_inx,  // instruction for creating test_wallet_1 ata
        mint_token_inx,    // intruction for minting 100 tokens into test_wallet_1 ata
        wallet_2_ata_inx   // instruction for creating test_wallet_1 ata
    );
    // send the transaction to the network
    const tnx_sig = await anchor.AnchorProvider.env().sendAndConfirm(
        tnx,
        [test_wallet_1_keypair, test_wallet_2_keypair, mint_keypair]
        );
    console.log("tnx signature:", tnx_sig)
    
    // make an rpc call to the on-chain program
    const tx = await program.methods.tokenTransfer(new BN(10_000_000_000))
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      senderAta: wallet_1_ata_address,
      receiverAta: wallet_2_ata_address,
      senderWallet: test_wallet_1_keypair.publicKey
    })
    .signers([test_wallet_1_keypair])
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
