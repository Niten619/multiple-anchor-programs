import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { StreamWithdrawTimelog } from "../target/types/stream_withdraw_timelog";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, MintLayout, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction, AccountLayout, closeAccount } from "@solana/spl-token";
import { readFileSync } from "fs";
import { BN } from "bn.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";

describe("stream-withdraw-timelog", () => {
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

  // get PDA address with the exact seeds value as used in the on-chain program
  const [timelog_pda, _] = findProgramAddressSync(
    [Buffer.from(anchor.utils.bytes.utf8.encode("timelog")),
    test_wallet_1_keypair.publicKey.toBuffer()],
    program.programId
    );
    console.log("timelog_pda:", timelog_pda.toString())
    // generate a new keypair for the vault account
    const vault_keypair = anchor.web3.Keypair.generate();
    console.log("Vault pubkey:", vault_keypair.publicKey.toString())

    // a function to set timeout or sleep
    const delay = ms => new Promise(res => setTimeout(res, ms));

  it("Stream Sol Test!!!", async () => {
    let test_wallet_1_balance = await provider.connection.getBalance(test_wallet_1_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("test_wallet_1_balance before:", test_wallet_1_balance)

    // intruction for creating an account
    const vault_acc_inx = anchor.web3.SystemProgram.createAccount({
        fromPubkey: anchor_wallet.publicKey,
        newAccountPubkey: vault_keypair.publicKey,
        lamports: 0,
        space: AccountLayout.span,
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
        timelogAccount: timelog_pda,
        senderAccount: test_wallet_1_keypair.publicKey,
        vaultAccount: vault_keypair.publicKey,
        receiverAccount: test_wallet_2_keypair.publicKey,
        systemProgram: SystemProgram.programId        
    })
    .signers([test_wallet_1_keypair])
    .rpc();
    console.log("Your transaction signature", tx_signature);
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
        timelogAccount: timelog_pda,
        vaultAccount: vault_keypair.publicKey,
        receiverAccount: test_wallet_2_keypair.publicKey,
        senderAccount: test_wallet_1_keypair.publicKey,
        systemProgram: SystemProgram.programId        
    })
    .signers([vault_keypair])
    .rpc();
    console.log("Your transaction signature", tx_signature);
    vault_account_balance = await provider.connection.getBalance(vault_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("vault_account_balance after:", vault_account_balance)
    test_wallet_2_balance = await provider.connection.getBalance(test_wallet_2_keypair.publicKey)/LAMPORTS_PER_SOL;
    console.log("test_wallet_2_balance after:", test_wallet_2_balance)
    
  });
});
