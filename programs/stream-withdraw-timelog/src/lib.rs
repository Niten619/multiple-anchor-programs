use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer as Sol_Transfer, transfer as sol_transfer};
use anchor_spl::token::{Token, TokenAccount, Transfer as Token_Transfer, transfer as token_transfer};

declare_id!("6MX8LNw7iRBabJwiHDfc58MJMs79gkd4tQXtPquHLCEd");

#[program]
pub mod stream_withdraw_timelog {
    use super::*;

    pub fn stream_sol(ctx: Context<StreamSol>, amount: u64, start_time: u64) -> Result<()> {
        ctx.accounts.timelog_account_sol.start_time = start_time;
        ctx.accounts.timelog_account_sol.amount = amount;
        ctx.accounts.timelog_account_sol.receiver_account = *ctx.accounts.receiver_account.key;
        
        let cpi_ctx_program = ctx.accounts.system_program.to_account_info();
        let transfer_struct = Sol_Transfer{
            from: ctx.accounts.sender_account.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        sol_transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {   
        // check whether the account trying to withdraw the stream amount is authorized or not
        if *ctx.accounts.receiver_account.key != ctx.accounts.timelog_account_sol.receiver_account.key(){
            return Err(error!(ErrorTypes::UnauthorizedAccount));
        }
        // check whether the amount trying to be withdrawn is more than the streamed amount
        if amount > ctx.accounts.timelog_account_sol.amount{
            return Err(error!(ErrorTypes::WithdrawLimitExceeded));
        }
        // get the latest timestamp
        let time_now = Clock::get()?.unix_timestamp as u64;
        msg!("Time Now (during Withdraw): {}", time_now);
        msg!("Time Recorded (during Stream): {}", ctx.accounts.timelog_account_sol.start_time);

        // check whether the latest timestamp is 24 hours later than the start_time recorded at streaming
        // if time_now < ctx.accounts.timelog_account.start_time + (24 * 60 * 60){
            // msg!("24 hours has not passed from the time of stream!!!");
            // return Err(error!(ErrorTypes::TimeNotPassed));
        // }
        if time_now < ctx.accounts.timelog_account_sol.start_time + 4{
            msg!("4 sec has not passed from the time of stream!!!");
            return Err(error!(ErrorTypes::TimeNotPassed));
        }

        let cpi_ctx_program = ctx.accounts.system_program.to_account_info();
        let transfer_struct = Sol_Transfer{
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx.accounts.receiver_account.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        sol_transfer(cpi_ctx, amount)?;
        Ok(())
    }


    pub fn stream_spl(ctx: Context<StreamSpl>, amount: u64, start_time: u64) -> Result<()> {
        ctx.accounts.timelog_account_spl.start_time = start_time;
        ctx.accounts.timelog_account_spl.amount = amount;
        ctx.accounts.timelog_account_spl.vault_ata = ctx.accounts.vault_ata.key();
        ctx.accounts.timelog_account_spl.receiver_ata = ctx.accounts.receiver_ata.key();
        
        let cpi_ctx_program = ctx.accounts.token_program.to_account_info();
        let transfer_struct = Token_Transfer{
            from: ctx.accounts.sender_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.sender_account.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        token_transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw_spl(ctx: Context<WithdrawSpl>, amount: u64) -> Result<()> {
        // check whether the account trying to withdraw the stream amount is authorized or not
        if ctx.accounts.receiver_ata.key() != ctx.accounts.timelog_account_spl.receiver_ata.key(){
            return Err(error!(ErrorTypes::UnauthorizedAccount));
        }
        // check whether the amount trying to be withdrawn is more than the streamed amount
        if amount > ctx.accounts.timelog_account_spl.amount{
            return Err(error!(ErrorTypes::WithdrawLimitExceeded));
        }
        // get the latest timestamp
        let time_now = Clock::get()?.unix_timestamp as u64;
        msg!("Time Now: {}", time_now);
        // check whether the latest timestamp is 24 hours later than the start_time recorded at streaming
        // if time_now < ctx.accounts.timelog_account.start_time + (24 * 60 * 60){
            // msg!("24 hours has not passed from the time of stream!!!");
            // return Err(error!(ErrorTypes::TimeNotPassed));
        // }
        if time_now < ctx.accounts.timelog_account_spl.start_time + 4{
            msg!("4 sec has not passed from the time of stream!!!");
            return Err(error!(ErrorTypes::TimeNotPassed));
        }
        let cpi_ctx_program = ctx.accounts.token_program.to_account_info();
        let transfer_struct = Token_Transfer{
            from: ctx.accounts.vault_ata.to_account_info(),
            to: ctx.accounts.receiver_ata.to_account_info(),
            authority: ctx.accounts.vault_account.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        token_transfer(cpi_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct StreamSol<'info> {
    // This is how you create PDA with a desired seeds
    #[account(init_if_needed, payer = sender_account, space = 8 + 8 + 8 + 32, seeds = [b"timelog_sol", sender_account.key().as_ref()], bump)]
    pub timelog_account_sol: Account<'info, TimeLogSol>,
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
    #[account(mut, seeds = [b"timelog_sol", sender_account.key().as_ref()], bump)]
    pub timelog_account_sol: Account<'info, TimeLogSol>,
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

#[derive(Accounts)]
pub struct StreamSpl<'info> {
    // This is how you create PDA with a desired seeds
    #[account(init_if_needed, payer = sender_account, space = 8 + 8 + 8 + 32 + 32, seeds = [b"timelog_spl", sender_account.key().as_ref()], bump)]
    pub timelog_account_spl: Account<'info, TimeLogSpl>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub sender_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_ata: Account<'info, TokenAccount>,  // we need this to store it in PDA for verification checks in withdraw_spl function
    #[account(mut)]
    pub sender_account: Signer<'info>,
    pub token_program: Program<'info, Token>
    
}

#[derive(Accounts)]
pub struct WithdrawSpl<'info> {
    #[account(mut, seeds = [b"timelog_spl", sender_account.key().as_ref()], bump)]
    pub timelog_account_spl:Account<'info, TimeLogSpl>,
    /// CHECK:
    #[account(mut)]
    pub sender_account: AccountInfo<'info>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_account: Signer<'info>,
    pub token_program: Program<'info, Token>
}

#[account]
pub struct TimeLogSol{
    start_time: u64,
    amount: u64,
    receiver_account: Pubkey,
}

#[account]
pub struct TimeLogSpl{
    start_time: u64,
    amount: u64,
    vault_ata: Pubkey,
    receiver_ata: Pubkey,
}

#[error_code]
pub enum ErrorTypes {
    #[msg("Unauthorized Account For Withdrawal")]
    UnauthorizedAccount,
    #[msg("Withdraw Amount more than Amount Streamed")]
    WithdrawLimitExceeded,
    #[msg("Expected Time Not Passed")]
    TimeNotPassed
}