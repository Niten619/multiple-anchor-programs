import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { FacebookMini } from "../target/types/facebook_mini";
import { readFileSync } from "fs";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";

describe("facebook-mini", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FacebookMini as Program<FacebookMini>;

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

  const FB_ACC_SEED = "facebook-mini-account";
  /**
   * NOTE: While paying for the creation of a PDA account on-chain, 
   * never use as 'payer' such an account which has some data allocated. 
   * In other words, always use such an account which has Allocated Data Size equal to 0 byte, otherwise we get error as:
   * Transfer: `from` must not carry data
   */
  const [fb_acc_pda_wallet_2, _] = findProgramAddressSync(
    [Buffer.from(anchor.utils.bytes.utf8.encode(FB_ACC_SEED)),
    test_wallet_2_keypair.publicKey.toBytes()],
    program.programId
    );
    console.log("fb_acc_pda_wallet_2:", fb_acc_pda_wallet_2.toBase58())

  it("Create Facebook Account and Post!!!", async () => {
    /**
     * If you set "seeds = true" in [features] of Anchor.toml file, you will enable anchor's auto-infer PDA addresses feature.
     * When this feature is turned on, your client code does not need to manually derive PDA addresses since
     * seeds will be parsed into the IDL and automatically used to generate PDAs.
     * In that case, you can directly proceed to make rpc call to on-chain program as below.
     */
    // const ix = program.methods.createFbAccountAndPost("Niten", "Hello there, it's me!")
    // const userFacebookAddress = (await ix.pubkeys()).fbAccount
    // console.log("User facebook address:", userFacebookAddress);
    // // Create user's facebook address
    // const tx = await ix.rpc()
    // console.log("Your transaction signature", tx);
    // // User Details
    // let userDetails = await program.account.fbAccountContent.fetch(userFacebookAddress);
    // console.log(`Created a new account with following details \n 
    // Name: ${userDetails.name} \n Status: ${userDetails.status}`)

    /**
     * By default, anchor's auto-infer PDA addresses feature is turned off.
     * And this is how you would normally make an rpc call to the on-chain program
     */
    const tx_signature = await program.methods.createFbAccountAndPost(
        "Nick",
        "Hey Guys, What's Up!"
    ).accounts({
        fbAccount: fb_acc_pda_wallet_2,
        signer: test_wallet_2_keypair.publicKey,
        systemProgram: SystemProgram.programId
    }).signers([test_wallet_2_keypair])
    .rpc();
    console.log("Your transaction signature", tx_signature)
    
    // fetch the account that was created on-chain
    const fb_acc_wallet_2_onchain = await program.account.fbAccountContent.fetch(fb_acc_pda_wallet_2);
    console.log("fb_acc_wallet_2_onchain:", fb_acc_wallet_2_onchain)
  });

  it("Update Fb Status!!!", async () => {
    // make an rpc call to the on-chain program
    const tx_signature = await program.methods.updateFbStatus(
        "Hello all, this is a new status!"
    )
    .accounts({
        fbAccount: fb_acc_pda_wallet_2,
        signer: test_wallet_2_keypair.publicKey
    })
    .signers([test_wallet_2_keypair])
    .rpc();
    console.log("Your transaction signature", tx_signature)

    // fetch the account that was updated with a new status
    const fb_acc_wallet_2_onchain = await program.account.fbAccountContent.fetch(fb_acc_pda_wallet_2);
    console.log("fb_acc_wallet_2_onchain:", fb_acc_wallet_2_onchain)
  });

  it("Delete the Fb Account that was created on-chain!!!", async () => {
    // make an rpc call to the on-chain program
    const tx_signature = await program.methods.deleteFbAccount()
    .accounts({
        fbAccount: fb_acc_pda_wallet_2,
        signer: test_wallet_2_keypair.publicKey
    })
    .signers([test_wallet_2_keypair])
    .rpc();
    console.log("Your transaction signature", tx_signature)

    // try to fetch the account that was deleted or closed
    try{
        const fb_acc_wallet_2_onchain = await program.account.fbAccountContent.fetch(fb_acc_pda_wallet_2);
        console.log("fb_acc_wallet_2_onchain:", fb_acc_wallet_2_onchain)
    } catch {
        console.log("Could not find the given fb account !!!")
    }
  });
})