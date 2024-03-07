use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::state::SwapPool;

use super::{
    transfer_from_owner_to_vault, transfer_from_vault_to_owner, transfer_native_from_owner_to_pool,
    transfer_native_from_pool_to_owner,
};

pub fn perform_swap<'info>(
    swap_pool: &Account<'info, SwapPool>,
    token_authority: &Signer<'info>,
    token_owner_account: &Account<'info, TokenAccount>,
    token_vault: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    amount_sol: u64,
    amount_token: u64,
    sol_to_token: bool,
) -> Result<()> {
    if sol_to_token {
        transfer_native_from_owner_to_pool(
            &token_authority.to_account_info(),
            &swap_pool.to_account_info(),
            amount_sol,
        )?;

        transfer_from_vault_to_owner(
            swap_pool,
            token_vault,
            token_owner_account,
            token_program,
            amount_token,
        )?;
    } else {
        transfer_from_owner_to_vault(
            token_authority,
            token_owner_account,
            token_vault,
            token_program,
            amount_token,
        )?;

        transfer_native_from_pool_to_owner(
            &swap_pool.to_account_info(),
            &token_vault.to_account_info(),
            amount_sol,
            &[&swap_pool.seeds()],
        )?;
    }

    Ok(())
}
