import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { Blogpost } from "../target/types/blogpost";
import { readFileSync } from "fs";
import { BN } from "bn.js";
import { assert } from "chai";

describe("blogpost", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.Blogpost as Program<Blogpost>;
  
    // setting the test wallets keypair
    console.log("Setting keypairs for Test Wallets!")
    const test_wallet_1_path = __dirname + '/../test_accounts/test_wallet_1.json'
    const test_wallet_1_keypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(readFileSync(test_wallet_1_path, "utf-8"))));
    console.log("Test Wallet 1 pubkey:", test_wallet_1_keypair.publicKey.toString())
    
    const timestamp = Math.floor(Date.now()/1000);
    console.log("timestamp:", timestamp)
    console.log("new BN(timestamp):", new BN(timestamp).toNumber())
    it("create-post",async () => {
        const blog_account = Keypair.generate();
        console.log('Blog account pubkey:', blog_account.publicKey.toString())
        const tx = await program.methods.createPost(
            "Solana",
            "Solana is one of the fastest blockchian out there!",
            new BN(timestamp)
        )
        .accounts({
            blogContentAccount: blog_account.publicKey,
            user: test_wallet_1_keypair.publicKey,
            systemProgram: SystemProgram.programId
        })
        .signers([blog_account, test_wallet_1_keypair])
        .rpc();
        console.log("Your transaction signature", tx)

        // Get the account's contents from the blockchian using fetch
        let onchain_blog_account = await program.account.blogContentAccount.fetch(blog_account.publicKey);
        console.log("onchain_blog_account:", onchain_blog_account)
        console.log("onchain_blog_account.blogpostTimestamp:", onchain_blog_account.blogpostTimestamp)

        assert.ok(onchain_blog_account.blogTitle === "Solana");
        assert.ok(onchain_blog_account.blogpostTimestamp.toNumber() === new BN(timestamp).toNumber());
    });
});