use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::errors::ErrorCode;
use crate::state::SwapPool;
use crate::utils::perform_swap;
use crate::TOKEN_VAULT;

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut, address = swap_pool.token_mint)]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub swap_pool: Box<Account<'info, SwapPool>>,

    #[account(mut, constraint = token_owner_account.mint == swap_pool.token_mint)]
    pub token_owner_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [
            TOKEN_VAULT.as_ref(),
            swap_pool.token_mint.key().as_ref()
        ],
        bump
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<Swap>, swap_amount: u64, sol_to_token: bool) -> Result<()> {
    // check if swap amount is greater than 0
    require!(swap_amount > 0, ErrorCode::InvalidSwapAmount);

    let token_authority = &ctx.accounts.signer;
    let swap_pool = &ctx.accounts.swap_pool;
    let token_owner_account = &ctx.accounts.token_owner_account;
    let token_vault = &ctx.accounts.token_vault;
    let token_program = &ctx.accounts.token_program;
    let token_decimal = ctx.accounts.token_mint.decimals;

    let swap_pool_lamports = swap_pool.to_account_info().lamports();

    // Ensure there are enough funds in the pool to perform the swap.
    require!(
        (!sol_to_token && token_vault.amount > swap_amount)
            || (sol_to_token && swap_pool_lamports > swap_amount),
        ErrorCode::InsufficientFund
    );

    let (amount_sol, amount_token) =
        swap_pool.get_amount_out(token_decimal, swap_amount, sol_to_token);

    perform_swap(
        swap_pool,
        token_authority,
        token_owner_account,
        token_vault,
        token_program,
        amount_sol,
        amount_token,
        sol_to_token,
    )?;

    Ok(())
}
