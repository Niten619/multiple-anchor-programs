use anchor_lang::prelude::*;

declare_id!("9AhbZutPv6fofCspsCthvCqKgars2b89T1TMueHxcGtX");

#[program]
pub mod blogpost {
    use super::*;

    pub fn create_post(ctx: Context<CreatePost>, title: String, body: String, timestamp: u64) -> Result<()> {
        msg!("On-chain Program's create_post function!");
        let blog_account = &mut ctx.accounts.blog_content_account;
        blog_account.blog_title = title;
        blog_account.blog_body = body;
        blog_account.blogpost_timestamp = timestamp;
        msg!("blog_account.blog_title: {}",blog_account.blog_title);
        msg!("blog_account.blogpost_timestamp: {}",blog_account.blogpost_timestamp);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(init, payer=user, space= 1024)]
    blog_content_account: Account<'info, BlogContentAccount>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>
}

#[account]
pub struct BlogContentAccount{
    blog_title: String,
    blog_body: String,
    blogpost_timestamp: u64
}