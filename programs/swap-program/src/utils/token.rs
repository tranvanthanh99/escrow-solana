use crate::state::SwapPool;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};

pub fn transfer_from_owner_to_vault<'info>(
    owner_authority: &Signer<'info>,
    token_owner_account: &Account<'info, TokenAccount>,
    token_vault: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: token_owner_account.to_account_info(),
                to: token_vault.to_account_info(),
                authority: owner_authority.to_account_info(),
            },
        ),
        amount,
    )
}

pub fn transfer_from_vault_to_owner<'info>(
    swap_pool: &Account<'info, SwapPool>,
    token_vault: &Account<'info, TokenAccount>,
    token_owner_account: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            Transfer {
                from: token_vault.to_account_info(),
                to: token_owner_account.to_account_info(),
                authority: swap_pool.to_account_info(),
            },
            &[&swap_pool.seeds()],
        ),
        amount,
    )
}

pub fn close_vault_account<'info>(
    swap_pool: &Account<'info, SwapPool>,
    token_vault: &Account<'info, TokenAccount>,
    recipient: &AccountInfo<'info>,
    token_program: &Program<'info, Token>,
) -> Result<()> {
    token::close_account(CpiContext::new_with_signer(
        token_program.to_account_info(),
        CloseAccount {
            account: token_vault.to_account_info(),
            destination: recipient.to_account_info(),
            authority: swap_pool.to_account_info(),
        },
        &[&swap_pool.seeds()],
    ))
}