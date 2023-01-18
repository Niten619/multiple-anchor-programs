use anchor_lang::prelude::*;

declare_id!("3nzR5ZWMAvkePByUHiEFAnj3CsuVDbjs5VVdPZGUheqg");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_vote_bank(ctx: Context<InitVoteBank>) -> Result<()> {
        msg!("Initializing vote bank on-chain!!!");
        ctx.accounts.vote_account.eligibility = true;
        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote_for: VoteFor) -> Result<()> {
        match vote_for {
            VoteFor::P => {
                msg!("Voted for Prachandey!!!");
                ctx.accounts.vote_account.prachande_vote_count += 1;
            },
            VoteFor::K => {
                msg!("Voted for KP!!!");
                ctx.accounts.vote_account.kp_vote_count += 1;
            },
            VoteFor::S => {
                msg!("Voted for Sherey!!!");
                ctx.accounts.vote_account.sherey_vote_count += 1;
            }
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitVoteBank<'info> {
    #[account(init_if_needed, payer = user, space = 8 + 1 + 8 + 8 + 8)]
    vote_account: Account<'info, VoteBankInfo>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    vote_account: Account<'info, VoteBankInfo>,
    #[account(mut)]
    user: Signer<'info>
}

#[account]
pub struct VoteBankInfo{
    eligibility: bool,
    prachande_vote_count: u64,
    kp_vote_count: u64,
    sherey_vote_count: u64
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum VoteFor {
    P,  // for Prachande
    K,  // for KP
    S   // for Sherey
}