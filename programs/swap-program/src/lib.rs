use anchor_lang::prelude::*;

declare_id!("3zQ1ZZSEPG6LeVij4pwsfE4D1RvKjGZvkNvtnzHasSVr");

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

pub const SWAP_POOL_SEED: &[u8] = b"swap_pool";
pub const TOKEN_VAULT: &[u8] = b"token_vault";
pub const NATIVE_VAULT: &[u8] = b"native_vault";

#[program]
pub mod swap_program {
    use super::*;

    pub fn initialize(ctx: Context<InitializePool>, token_price: [u64; 2]) -> Result<()> {
        instructions::initialize_pool::handler(ctx, token_price)
    }

    pub fn swap(ctx: Context<Swap>, swap_amount: u64, sol_to_token: bool) -> Result<()> {
        instructions::swap::handler(ctx, swap_amount, sol_to_token)
    }

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        instructions::close_pool::handler(ctx)
    }
}
