use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer, transfer};

declare_id!("233b2ADNn7Jam3WzYkF44bdPWuTYr7iEt1vd4K4y3J91");

#[program]
pub mod sol_transfer {
    use super::*;

    pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
        msg!("Anchor Program being Invoked");
        let cpi_ctx_program = ctx.accounts.system_program.to_account_info();
        let transfer_struct = Transfer{
            from: ctx.accounts.sender_account.to_account_info(),
            to: ctx.accounts.receiver_account.to_account_info()
        };
        // create a cpicontext for transfer function
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        // perform the actual transfer with the help of 'transfer' function
        msg!("Performing transfer operation!");
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
    #[account(mut)]
    pub sender_account: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub receiver_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}
