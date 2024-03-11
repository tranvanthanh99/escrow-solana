use crate::state::*;
use crate::utils::{close_vault_account, transfer_from_vault_to_owner};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(mut, close=initializer, has_one=initializer)]
    pub swap_pool: Box<Account<'info, SwapPool>>,

    #[account(mut, address = swap_pool.initializer)]
    pub initializer: Signer<'info>,

    #[account(mut, constraint = user_token_account.mint == token_vault.mint)]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = swap_pool.token_vault)]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<ClosePool>) -> Result<()> {
    let token_vault = &ctx.accounts.token_vault;
    let token_program = &ctx.accounts.token_program;
    let user_token_account = &ctx.accounts.user_token_account;
    let swap_pool = &ctx.accounts.swap_pool;
    let initializer = &ctx.accounts.initializer;

    transfer_from_vault_to_owner(
        swap_pool,
        token_vault,
        user_token_account,
        token_program,
        token_vault.amount,
    )?;

    close_vault_account(
        swap_pool,
        token_vault,
        &initializer.to_account_info(),
        token_program,
    )?;

    Ok(())
}
