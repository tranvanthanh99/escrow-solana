use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::SWAP_POOL_SEED;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializePool<'info> {
    pub token_mint_move: Account<'info, Mint>,

    #[account(
        init,
        payer=funder, 
        space = SwapPool::LEN,
        seeds = [SWAP_POOL_SEED.as_ref(), token_mint_move.key().as_ref()],
        bump
    )]
    pub swap_pool: Account<'info, SwapPool>,

    #[account(
        init, 
        payer=funder,
        token::mint=token_mint_move,
        token::authority=swap_pool,
    )]
    pub token_vault_move: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePool>, token_price: [u64; 2]) -> Result<()> {
    let swap_pool = &mut ctx.accounts.swap_pool;
    let token_mint_move = ctx.accounts.token_mint_move.key();
    let token_vault_move = ctx.accounts.token_vault_move.key();

    let bump = ctx.bumps.swap_pool;

    Ok(swap_pool.initialize(bump, token_mint_move, token_vault_move, token_price)?)
}