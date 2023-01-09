use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, transfer};

declare_id!("HgwtqfhYZn2tRe4Ds8FCbF47qwWnJMj7T19tusZCm3eW");

#[program]
pub mod spl_transfer {

    use super::*;

    pub fn token_transfer(ctx: Context<TokenTransfer>, amount: u64) -> Result<()> {
        let cpi_ctx_program = ctx.accounts.token_program.to_account_info();
        let transfer_struct = Transfer{
            from: ctx.accounts.sender_ata.to_account_info(),
            to: ctx.accounts.receiver_ata.to_account_info(),
            authority: ctx.accounts.sender_wallet.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_ctx_program, transfer_struct);
        // now perform the actual spl token transfer
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TokenTransfer<'info> {
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub sender_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_ata: Account<'info, TokenAccount>,
    pub sender_wallet: Signer<'info>,
}
