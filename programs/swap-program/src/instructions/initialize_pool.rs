use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::{SWAP_POOL_SEED, TOKEN_VAULT};
use crate::state::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializePool<'info> {
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer=funder, 
        space = SwapPool::LEN,
        seeds = [SWAP_POOL_SEED.as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub swap_pool: Account<'info, SwapPool>,

    #[account(
        init, 
        payer=funder,
        seeds= [
            TOKEN_VAULT.as_ref(),
            token_mint.key().as_ref()
        ],
        bump,
        token::mint=token_mint,
        token::authority=swap_pool,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializePool>, token_price: [u64; 2], bump: u8) -> Result<()> {
    let funder = ctx.accounts.funder.key();
    let token_mint = ctx.accounts.token_mint.key();
    let token_vault = ctx.accounts.token_vault.key();
    let swap_pool = &mut ctx.accounts.swap_pool;

    swap_pool.initialize(
        funder,
        bump,
        token_mint,
        token_vault,
        token_price
    )?;

    Ok(())
}