import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { FacebookMini } from "../target/types/facebook_mini";
import { readFileSync } from "fs";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { BN } from "bn.js";

describe("facebook-mini", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FacebookMini as Program<FacebookMini>;

  // setting the test wallets keypair
  console.log("Setting keypairs for Test Wallets!")
  const test_wallet_1_path = __dirname + '/../test_accounts/test_wallet_1.json'
//   const test_wallet_2_path = __dirname + '/../test_accounts/test_wallet_2.json'
  const test_wallet_1_keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(test_wallet_1_path, "utf-8"))));
//   const test_wallet_2_keypair = Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(readFileSync(test_wallet_2_path, "utf-8"))));
  console.log("Test Wallet 1 pubkey:", test_wallet_1_keypair.publicKey.toString())
//   console.log("Test Wallet 2 pubkey:", test_wallet_2_keypair.publicKey.toString())

  const FB_ACC_SEED = "facebook-mini-account";
  const [fb_acc_pda_wallet_1, _] = findProgramAddressSync(
    [Buffer.from(anchor.utils.bytes.utf8.encode(FB_ACC_SEED)),
    test_wallet_1_keypair.publicKey.toBuffer()],
    program.programId
    );
    console.log("fb_acc_pda_wallet_1:", fb_acc_pda_wallet_1.toBase58())

  it("Create Facebook Account and Post!!!", async () => {
    // make an rpc call to the on-chain program
    const tx_signature = await program.methods.createFbAccountAndPost(
        "Niten",
        "Hello there, it's me!"
    ).accounts(
        {
            fbAccount: fb_acc_pda_wallet_1,
            signer: test_wallet_1_keypair.publicKey,
            systemProgram: SystemProgram.programId
        }
    ).signers(
        [test_wallet_1_keypair]
    ).rpc();
    console.log("Your transaction signature", tx_signature)

    // fetch the account that was created on-chain
    const fb_acc_wallet_1_onchain = await program.account.fbAccountContent.fetch(fb_acc_pda_wallet_1);
    console.log("fb_acc_wallet_1_onchain:", fb_acc_wallet_1_onchain)
  });

//   it("Update Fb Status!!!", async () => {
//     // make an rpc call to the on-chain program
//     const tx_signature = await program.methods.updateFbStatus(
//         "Hello all, this is a new status!"
//     )
//     .accounts({
//         fbAccount: fb_acc_pda_wallet_1,
//         signer: test_wallet_1_keypair.publicKey
//     })
//     .signers([test_wallet_1_keypair])
//     .rpc();
//     console.log("Your transaction signature", tx_signature)

//     // fetch the account that was updated with a new status
//     const fb_acc_wallet_1_onchain = await program.account.fbAccountContent.fetch(fb_acc_pda_wallet_1);
//     console.log("fb_acc_wallet_1_onchain:", fb_acc_wallet_1_onchain)
//   });

//   it("Delete the Fb Account that was created on-chain!!!", async () => {
//     // make an rpc call to the on-chain program
//     const tx_signature = await program.methods.deleteFbAccount()
//     .accounts({
//         fbAccount: fb_acc_pda_wallet_1,
//         signer: test_wallet_1_keypair.publicKey
//     })
//     .signers([test_wallet_1_keypair])
//     .rpc();
//     console.log("Your transaction signature", tx_signature)

//     // try to fetch the account that was deleted
//     try{
//         const fb_acc_wallet_1_onchain = await program.account.fbAccountContent.fetch(fb_acc_pda_wallet_1);
//         console.log("fb_acc_wallet_1_onchain:", fb_acc_wallet_1_onchain)
//     } catch {
//         console.log("Could not find the given fb account !!!")
//     }
//   });
})