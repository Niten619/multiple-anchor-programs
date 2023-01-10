import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolTransfer } from "../target/types/sol_transfer";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { readFileSync } from "fs";
import { BN } from "bn.js";

describe("sol-transfer", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.SolTransfer as Program<SolTransfer>;

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
  
  it("Sol Transfer Test!!!", async () => {
    // Add your test here.
    const tx = await program.methods.transferSol(new BN(1000000000))
    .accounts({
      senderAccount: test_wallet_1_keypair.publicKey,
      receiverAccount: test_wallet_2_keypair.publicKey,
      systemProgram: SystemProgram.programId
    })
    .signers([test_wallet_1_keypair])
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
