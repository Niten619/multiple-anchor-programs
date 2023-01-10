use anchor_lang::prelude::*;
use anchor_lang::{system_program::{Transfer, transfer}};

declare_id!("6MX8LNw7iRBabJwiHDfc58MJMs79gkd4tQXtPquHLCEd");

#[program]
pub mod stream_withdraw_timelog {
    use super::*;

    pub fn stream_sol(ctx: Context<StreamSol>, amount: u64, start_time: u64) -> Result<()> {
        ctx.accounts.timelog_account.start_time = start_time;
        ctx.accounts.timelog_account.amount = amount;
        ctx.accounts.timelog_account.receiver_account = *ctx.accounts.receiver_account.key;
        
        let cpi_ctx_program = ctx.accounts.system_program.to_account_info();
        let transfer_struct = Transfer{
            from: ctx.accounts.sender_account.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {   
        // check whether the account trying to withdraw the stream amount is authorized or not
        if *ctx.accounts.receiver_account.key != ctx.accounts.timelog_account.receiver_account.key(){
            msg!("Unauthorized Account!!!");
            return Err(error!(ErrorCode::InvalidProgramExecutable));
        }
        // check whether the amount trying to be withdrawn is more than the streamed amount
        if amount > ctx.accounts.timelog_account.amount{
            msg!("Amount limit Overreached!!!");
        }
        // get the latest timestamp
        let time_now = Clock::get()?.unix_timestamp as u64;
        msg!("Time Now: {}", time_now);

        // check whether the latest timestamp is 24 hours later than the start_time recorded at streaming
        // if time_now > ctx.accounts.timelog_account.start_time + (24 * 60 * 60){
            // msg!("24 hours has not passed from the time of stream!!!");
            // return ErrorCode::InvalidProgramExecutable;
        // }
        if time_now < ctx.accounts.timelog_account.start_time + 4{
            msg!("4 sec has not passed from the time of stream!!!");
            return Err(error!(ErrorCode::InvalidProgramExecutable));
        }

        let cpi_ctx_program = ctx.accounts.system_program.to_account_info();
        let transfer_struct = Transfer{
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx.accounts.receiver_account.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StreamSol<'info> {
    // This is how you create PDA with a desired seeds
    #[account(init_if_needed, payer = sender_account, space = 8 + 8 + 8 + 32, seeds = [b"timelog", sender_account.key().as_ref()], bump)]
    pub timelog_account: Account<'info, TimeLog>,
    #[account(mut)]
    pub sender_account: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub vault_account: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub receiver_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    // This is how you reuse the already existing PDA with the help of seeds and bump 
    #[account(mut, seeds = [b"timelog", sender_account.key().as_ref()], bump)]
    pub timelog_account: Account<'info, TimeLog>,
    #[account(mut)]
    pub vault_account: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub receiver_account: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub sender_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>
    
}

#[account]
pub struct TimeLog{
    start_time: u64,
    amount: u64,
    receiver_account: Pubkey,
}
