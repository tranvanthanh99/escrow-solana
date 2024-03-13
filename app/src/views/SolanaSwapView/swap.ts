import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import { env } from "./data";
import { Transaction } from "@solana/web3.js";
import { Wallet } from "./useProgram";

const SWAP_TOKEN = "3ni15tDdtH2spcGiUEKu64DbuXWbdenehMjSjaHbPTzP";
const tokenMint = new anchor.web3.PublicKey(env.swap_token);

type SwapProps = {
  program: anchor.Program<anchor.Idl>;
  wallet: Wallet;
  amount: anchor.BN;
  solToMove: boolean;
};

const SWAP_POOL_PDA_SEED = "swap_pool";
const TOKEN_VAULT_PDA_SEED = "token_vault";

interface PDAParam {
  key: anchor.web3.PublicKey;
  bump: number;
}

export const getAtaAccount = async (wallet: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
  let userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(tokenMint, wallet);
  return userAssociatedTokenAccount;
};

export const getSwapPoolPDA = async (programId: any): Promise<PDAParam> => {
  const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(SWAP_POOL_PDA_SEED),
      tokenMint.toBuffer(),
      // anchor.utils.bytes.utf8.encode(env.internal_id)
    ],
    programId
  );

  return {
    key: pda,
    bump: bump,
  };
};

export const getTokenVaultPDA = async (programId: any): Promise<PDAParam> => {
  const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(TOKEN_VAULT_PDA_SEED),
      tokenMint.toBuffer(),
      // anchor.utils.bytes.utf8.encode(env.internal_id)
    ],
    programId
  );

  return {
    key: pda,
    bump: bump,
  };
};
export const swap = async ({ program, wallet, amount, solToMove }: SwapProps) => {
  let swapPoolPDA = await getSwapPoolPDA(program.programId);
  let tokenVaultPDA = await getTokenVaultPDA(program.programId);
  let tokenOwnerAccount = await getAtaAccount(wallet.publicKey);

  // Check if the ATA already exists
  const accountInfo = await program.provider.connection.getAccountInfo(tokenOwnerAccount);
  if (accountInfo === null) {
    console.log("ATA does not exist, creating...");

    // Create a transaction to create the ATA
    const transaction = new Transaction().add(
      spl.createAssociatedTokenAccountInstruction(
        wallet.publicKey, // Payer of the transaction fee (also the owner of the ATA)
        tokenOwnerAccount, // The ATA address that will be created
        wallet.publicKey, // The owner of the ATA
        tokenMint // The mint address of the token
      )
    );

    // Add the swap instruction
    const swapInstruction = await program.instruction.swap(amount, solToMove, {
      accounts: {
        signer: wallet.publicKey,
        swapPool: swapPoolPDA.key,
        tokenMint: tokenMint,
        tokenVault: tokenVaultPDA.key,
        tokenOwnerAccount: tokenOwnerAccount, // Use the ATA as the owner account for the swap
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    });
    transaction.add(swapInstruction);

    // Set the recent blockhash
    transaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    // Set the transaction fee payer
    transaction.feePayer = wallet.publicKey;

    const signedTx = await wallet.signTransaction(transaction);
    const txid = await program.provider.connection.sendRawTransaction(signedTx.serialize());
    await program.provider.connection.confirmTransaction(txid, "finalized");
    return txid;
  } else {
    console.log(wallet);
    console.log(amount);
    console.log(`Program id: ${program.programId.toBase58()}`);
    const tx = await program.rpc.swap(amount, solToMove, {
      accounts: {
        signer: wallet.publicKey,
        swapPool: swapPoolPDA.key,
        tokenMint: tokenMint,
        tokenVault: tokenVaultPDA.key,
        tokenOwnerAccount: tokenOwnerAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      },
      signers: [],
    });
    await program.provider.connection.confirmTransaction(tx, "finalized");

    return tx;
  }
};
