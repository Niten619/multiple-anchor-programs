import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { Voting } from "../target/types/voting";
import { readFileSync } from "fs";

describe("voting", async () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Voting as Program<Voting>;
    const anchor_wallet = provider.wallet;
    // const wallet = anchor.AnchorProvider.env().wallet;
    
    /* SETTING UP THE VOTING ACCOUNT*/
    // generate a new vote account keypair
    // const vote_account = Keypair.generate();
    // console.log("vote_account pubkey:", vote_account.publicKey.toBase58())

        // or, use an already existing local keypair like below

    // setting the test wallets keypair as vote account
    const test_wallet_1_path = __dirname + '/../test_accounts/test_wallet_1.json'
    const vote_account = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(readFileSync(test_wallet_1_path, "utf-8"))));
    console.log("Test Wallet 1 (Vote account)) pubkey:", vote_account.publicKey.toBase58())

    it("Initialize Voting Bank", async() => {
        // make an rpc call to the on-chain program
        const tx_sig = await program.methods.initializeVoteBank()
        .accounts({
            voteAccount: vote_account.publicKey,
            user: anchor_wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([vote_account])
        .rpc();
        console.log("Your transaction signature", tx_sig)

        const vote_account_onchain = await program.account.voteBankInfo.fetch(vote_account.publicKey);
        console.log("vote_account_onchain:", vote_account_onchain)
    });

    it("Cast Vote", async() => {
        // make an rpc call to the on-chain program
        const tx_sig = await program.methods.castVote({
            s:{}  // this is how you map rust enum type from js/ts
        })
        .accounts({
            voteAccount: vote_account.publicKey,
            user: anchor_wallet.publicKey
        })
        .signers([])
        .rpc();
        console.log("Your transaction signature", tx_sig)
        
        const vote_account_onchain = await program.account.voteBankInfo.fetch(vote_account.publicKey);
        console.log("vote_account_onchain:", vote_account_onchain)
    });
});