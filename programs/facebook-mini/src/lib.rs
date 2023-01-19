use anchor_lang::prelude::*;

declare_id!("A1aAE7mJNJrDgqbGag1Qg2jEqYQghN6x7JqZv5n8kKxP");

#[program]
pub mod facebook_mini {

    use super::*;

    pub fn create_fb_account_and_post(ctx: Context<CreateFbAccount>, name: String, status: String) -> Result<()> {
        // check the size of the 'name' and 'status' to make sure it doesn't exceed the alloted space in the account created
        if name.as_bytes().len() > 10{
            msg!("Name should have less than 10 chars !!!");
            panic!();
        }
        if status.as_bytes().len() > 200{
            msg!("Status should have less than 200 chars in total !!!");
            panic!();
        }
        let fb_acc = &mut ctx.accounts.fb_account;
        fb_acc.name = name;
        fb_acc.status = status;
        fb_acc.bump = *ctx.bumps.get("facebook-mini-account").unwrap();
        msg!("Congrats on creating your Facebook-Mini Account!!!");
        Ok(())
    }

    pub fn update_fb_status(ctx: Context<UpdateFbStatus>, new_status: String) -> Result<()> {
        // check whether the new_name exceeds 10 chars
        if new_status.as_bytes().len() > 200{
            msg!("Status should have less than 200 chars in total !!!");
            panic!();
        }
        msg!("Your Previous Status: {}", ctx.accounts.fb_account.status);
        ctx.accounts.fb_account.status = new_status;
        msg!("Your Updated Status: {}", ctx.accounts.fb_account.status);
        Ok(())
    }

    pub fn delete_fb_account(ctx: Context<DeleteFbAccount>) -> Result<()> {
        msg!("Deleting your Fb account: {}", ctx.accounts.fb_account.name);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateFbAccount<'info> {
    // This is how you create a PDA with a custom seeds value
    #[account(init, payer=signer, space= 8 + (4 + 10) + (4 + 200) + 1, seeds= [b"facebook-mini-account", signer.key().as_ref()], bump)]
    fb_account: Account<'info, FBAccountContent>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct UpdateFbStatus<'info> {
    // This is how you reuse an already created PDA
    #[account(mut, seeds= [b"facebook-mini-account", signer.key().as_ref()], bump=fb_account.bump)]
    fb_account: Account<'info, FBAccountContent>,
    signer: Signer<'info>
}

#[derive(Accounts)]
pub struct DeleteFbAccount<'info> {
    #[account(mut, seeds= [b"facebook-mini-account", signer.key().as_ref()], bump=fb_account.bump, close=signer)]
    fb_account: Account<'info, FBAccountContent>,
    signer: Signer<'info>
}

#[account]
pub struct FBAccountContent{
    name: String,  // let this be 10 chars at max
    status: String,  // let this be 200 chars at max
    bump: u8
}
