use anchor_lang::prelude::*;

declare_id!("3zQ1ZZSEPG6LeVij4pwsfE4D1RvKjGZvkNvtnzHasSVr");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

pub const SWAP_POOL_SEED: &[u8] = b"swap_pool";

#[program]
pub mod swap_program {
    use super::*;

    pub fn initialize(ctx: Context<InitializePool>, token_price: [u64; 2]) -> Result<()> {
        instructions::initialize_pool::handler(ctx, token_price)
    }
}
