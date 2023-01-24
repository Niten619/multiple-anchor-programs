import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { StreamWithdrawTimelog } from "../target/types/stream_withdraw_timelog";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  MintLayout, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createInitializeMintInstruction, 
  createMintToInstruction, 
  AccountLayout, 
  getMinimumBalanceForRentExemptAccount } from "@solana/spl-token";
import { readFileSync } from "fs";
import { BN } from "bn.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";

describe("stream-withdraw-timelog", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.StreamWithdrawTimelog as Program<StreamWithdrawTimelog>;
  const anchor_wallet = provider.wallet;

  // setting the test wallets keypair
  console.log("Setting keypairs for Test Wallets!")
  const test_wallet_1_path = __dirname + '/../test_accounts/test_wallet_1.json'
  const test_wallet_2_path = __dirname + '/../test_accounts/test_wallet_2.json'
  const test_wallet_1_keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(test_wallet_1_path, "utf-8"))));
  const test_wallet_2_keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(test_wallet_2_path, "utf-8"))));
  console.log("Test Wallet 1 pubkey:", test_wallet_1_keypair.publicKey.toString())
  console.log("Test Wallet 2 pubkey:", test_wallet_2_keypair.publicKey.toString())

  // get timelog_sol PDA address with the exact seeds value as used in the on-chain program
  const [timelog_sol_pda, _] = findProgramAddressSync(
    [Buffer.from(anchor.utils.bytes.utf8.encode("timelog_sol")),
    test_wallet_1_keypair.publicKey.toBuffer()],
    program.programId
  );
  console.log("timelog_sol_pda:", timelog_sol_pda.toString())
  // get timelog_spl PDA address with the exact seeds value as used in the on-chain program
  const [timelog_spl_pda, __] = findProgramAddressSync(
    [Buffer.from(anchor.utils.bytes.utf8.encode("timelog_spl")),
    test_wallet_1_keypair.publicKey.toBuffer()],
    program.programId
    );
  console.log("timelog_spl_pda:", timelog_spl_pda.toString())
  // generate a new keypair for the vault account
  const vault_keypair = anchor.web3.Keypair.generate();
  console.log("Vault pubkey:", vault_keypair.publicKey.toString())
  // generate a new keypair for the mint account
  const mint_keypair = anchor.web3.Keypair.generate();
  console.log("Mint pubkey:", mint_keypair.publicKey.toString())

  // get the ATA address of the test wallet 1
  const wallet_1_ata_address = await getAssociatedTokenAddress(
    mint_keypair.publicKey,
    test_wallet_1_keypair.publicKey
  );
  console.log("wallet_1_ata_address:", wallet_1_ata_address.toString())
  // get the ATA address of the vault
  const vault_ata_address = await getAssociatedTokenAddress(
    mint_keypair.publicKey,
    vault_keypair.publicKey
  );
  console.log("vault_ata_address:", vault_ata_address.toString())
  // get the ATA address of the test wallet 2
  const wallet_2_ata_address = await getAssociatedTokenAddress(
    mint_keypair.publicKey,
    test_wallet_2_keypair.publicKey
  );
  console.log("wallet_2_ata_address:", wallet_2_ata_address.toString())

  // a function to set timeout or sleep
  const delay = ms => new Promise(res => setTimeout(res, ms));

  it("Stream Sol Test!!!", async () => {
    const MINIMUM_BALANCE_FOR_RENT_EXEMPT = await getMinimumBalanceForRentExemptAccount(provider.connection);
    console.log("MINIMUM_BALANCE_FOR_RENT_EXEMPT:", MINIMUM_BALANCE_FOR_RENT_EXEMPT)
    let test_wallet_1_balance = await provider.connection.getBalance(test_wallet_1_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("test_wallet_1_balance before:", test_wallet_1_balance)

    // intruction for creating an account (vault account in this case)
    const vault_acc_inx = anchor.web3.SystemProgram.createAccount({
      fromPubkey: anchor_wallet.publicKey,
      newAccountPubkey: vault_keypair.publicKey,
      lamports: MINIMUM_BALANCE_FOR_RENT_EXEMPT,
      space: 0,
      programId: SystemProgram.programId
    });
    // add intruction to a transaction and send it to the network
    const tnx = new anchor.web3.Transaction().add(vault_acc_inx);
    const tnx_sig = await provider.sendAndConfirm(
        tnx,
        [vault_keypair],
        {preflightCommitment: "confirmed"}
    );
    console.log("tnx signature:", tnx_sig)

    let vault_account_balance = await provider.connection.getBalance(vault_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("vault_account_balance before:", vault_account_balance)

    // get the timestamp at the time of stream
    const start_time = Math.floor(Date.now()/1000);
    console.log("start_time:", start_time)

    // make an rpc call to the on-chain program
    const tx_signature = await program.methods
    .streamSol(new BN(1_000_000_000), new BN(start_time))
    .accounts({
        timelogAccountSol: timelog_sol_pda,
        senderAccount: test_wallet_1_keypair.publicKey,
        vaultAccount: vault_keypair.publicKey,
        receiverAccount: test_wallet_2_keypair.publicKey,
        systemProgram: SystemProgram.programId        
    })
    .signers([test_wallet_1_keypair])
    .rpc();
    console.log("Your transaction signature", tx_signature)

    vault_account_balance = await provider.connection.getBalance(vault_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("vault_account_balance after:", vault_account_balance)
    test_wallet_1_balance = await provider.connection.getBalance(test_wallet_1_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("test_wallet_1_balance after:", test_wallet_1_balance)
    
  });

  it("Withdraw Sol Test!!!", async () => {
    let test_wallet_2_balance = await provider.connection.getBalance(test_wallet_2_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("test_wallet_2_balance before:", test_wallet_2_balance)

    console.log("Waiting for 5 secs...")
    await delay(5000);
    console.log("5 secs Over")

    let vault_account_balance = await provider.connection.getBalance(vault_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("vault_account_balance before:", vault_account_balance)
    // make an rpc call to the on-chain program
    const tx_signature = await program.methods
    .withdrawSol(new BN(1_000_000_000))
    .accounts({
        timelogAccountSol: timelog_sol_pda,
        vaultAccount: vault_keypair.publicKey,
        receiverAccount: test_wallet_2_keypair.publicKey,
        senderAccount: test_wallet_1_keypair.publicKey,
        systemProgram: SystemProgram.programId        
    })
    .signers([vault_keypair])
    .rpc();
    console.log("Your transaction signature", tx_signature)

    vault_account_balance = await provider.connection.getBalance(vault_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("vault_account_balance after:", vault_account_balance)
    test_wallet_2_balance = await provider.connection.getBalance(test_wallet_2_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("test_wallet_2_balance after:", test_wallet_2_balance)
  });

  it("Stream Spl Test!!!", async () => {
    // instruction for creating an account (mint account in this case)
    const mint_acc_inx = anchor.web3.SystemProgram.createAccount({
      fromPubkey: anchor_wallet.publicKey,
      newAccountPubkey: mint_keypair.publicKey,
      lamports: 1_000_000_000,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID
    });
    // instruction for initializing the mint account
    const mint_acc_init_inx = createInitializeMintInstruction(
      mint_keypair.publicKey,
      9,
      test_wallet_1_keypair.publicKey,
      test_wallet_1_keypair.publicKey
    )

    // get the timestamp at the time of stream
    const start_time = Math.floor(Date.now()/1000);
    console.log("start_time:", start_time)

    // instruction for creating associated token account (sender ata)
    const sender_ata_inx = createAssociatedTokenAccountInstruction(
      test_wallet_1_keypair.publicKey,
      wallet_1_ata_address,
      test_wallet_1_keypair.publicKey,
      mint_keypair.publicKey
    );
    // instruction for creating associated token account  (vault ata)
    const vault_ata_inx = createAssociatedTokenAccountInstruction(
      vault_keypair.publicKey,
      vault_ata_address,
      vault_keypair.publicKey,
      mint_keypair.publicKey
    );
    // instruction for creating associated token account (receiver ata)
    const receiver_ata_inx = createAssociatedTokenAccountInstruction(
      test_wallet_2_keypair.publicKey,
      wallet_2_ata_address,
      test_wallet_2_keypair.publicKey,
      mint_keypair.publicKey
    );
    // instruction for minting 100 tokens into test wallet 1's ata
    console.log("Forming instruction for minting 100 tokens into", wallet_1_ata_address.toString())
    const mint_token_inx = createMintToInstruction(
        mint_keypair.publicKey,
        wallet_1_ata_address,
        test_wallet_1_keypair.publicKey,
        100_000_000_000
    );
    // add all 3 instructions to a transaction
    const tnx = new anchor.web3.Transaction().add(
      mint_acc_inx,       // instruction for creating mint account
      mint_acc_init_inx,  // instruction for initializing the mint account
      sender_ata_inx,     // instruction for creating sender ata
      vault_ata_inx,      // instruction for creating vault ata
      receiver_ata_inx,   // instruction for creating receiver ata
      mint_token_inx      // instruction for minting tokens
    );
    // send the transaction to the network
    const tnx_sig = await anchor.AnchorProvider.env().sendAndConfirm(
      tnx,
      [test_wallet_1_keypair, test_wallet_2_keypair, vault_keypair, mint_keypair],
      {preflightCommitment: "confirmed"}
      );
    console.log("tnx signature:", tnx_sig)

    let test_wallet_1_token_balance = await provider.connection.getTokenAccountBalance(wallet_1_ata_address);
    console.log("test_wallet_1_token_balance before:", test_wallet_1_token_balance)
    let vault_ata_balance = await provider.connection.getTokenAccountBalance(vault_ata_address);
    console.log("vault_ata_balance before:", vault_ata_balance)

    // make an rpc call to the on-chain program
    const tx = await program.methods.streamSpl(
      new BN(10_000_000_000),
      new BN(start_time)
    ).accounts({
      senderAccount: test_wallet_1_keypair.publicKey,
      systemProgram: SystemProgram.programId,
      timelogAccountSpl: timelog_spl_pda,
      senderAta: wallet_1_ata_address,
      vaultAta: vault_ata_address,
      receiverAta: wallet_2_ata_address,
      tokenProgram: TOKEN_PROGRAM_ID
    }).signers([test_wallet_1_keypair])
    .rpc();
    console.log("Your transaction signature", tx)

    test_wallet_1_token_balance = await provider.connection.getTokenAccountBalance(wallet_1_ata_address);
    console.log("test_wallet_1_token_balance after:", test_wallet_1_token_balance)
    vault_ata_balance = await provider.connection.getTokenAccountBalance(vault_ata_address);
    console.log("vault_ata_balance after:", vault_ata_balance)
  });

  it("Withdraw Spl Test!!!", async () => {
    console.log("Waiting for 5 secs...")
    await delay(5000);
    console.log("5 secs Over")

    let vault_ata_balance = await provider.connection.getTokenAccountBalance(vault_ata_address);
    console.log("vault_ata_balance before:", vault_ata_balance)
    let test_wallet_2_token_balance = await provider.connection.getTokenAccountBalance(wallet_2_ata_address);
    console.log("test_wallet_2_token_balance before:", test_wallet_2_token_balance)

    // make an rpc call to the on-chain program
    const tx = await program.methods.withdrawSpl(
      new BN(10_000_000_000)
    ).accounts({
      timelogAccountSpl: timelog_spl_pda,
      senderAccount: test_wallet_1_keypair.publicKey,
      vaultAta: vault_ata_address,
      receiverAta: wallet_2_ata_address,
      vaultAccount: vault_keypair.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID
    }).signers([vault_keypair])
    .rpc();
    console.log("Your transaction signature", tx)

    vault_ata_balance = await provider.connection.getTokenAccountBalance(vault_ata_address);
    console.log("vault_ata_balance after:", vault_ata_balance)
    test_wallet_2_token_balance = await provider.connection.getTokenAccountBalance(wallet_2_ata_address);
    console.log("test_wallet_2_token_balance after:", test_wallet_2_token_balance)
  });
});
