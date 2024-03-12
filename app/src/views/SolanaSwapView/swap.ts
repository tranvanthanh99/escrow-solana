import * as anchor from "@project-serum/anchor";
import * as spl from '@solana/spl-token';
import {env} from "./data";
const tokenMint = new anchor.web3.PublicKey(env.swap_token);

type SwapProps = {
  program: anchor.Program<anchor.Idl>;
  wallet: any;
  amount: anchor.BN
};

const SWAP_POOL_PDA_SEED = "swap_pool";
const TOKEN_VAULT_PDA_SEED = "token_vault";


interface PDAParam {
    key: anchor.web3.PublicKey,
    bump: number
}

const getAtaAccount = async(wallet: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> =>{
  
  let userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
      tokenMint,
      wallet
  )
  return userAssociatedTokenAccount
}



const getSwapPoolPDA = async(program: any): Promise<PDAParam> => {
  const [pda, bump] = await anchor.web3.PublicKey
  .findProgramAddress(
      [
      anchor.utils.bytes.utf8.encode(SWAP_POOL_PDA_SEED),
      tokenMint.toBuffer(),
      ],
      program.programId
  );

  return {
      key: pda,
      bump: bump
  }
}

const getTokenVaultPDA = async(program: any): Promise<PDAParam> => {
  const [pda, bump] = await anchor.web3.PublicKey
  .findProgramAddress(
      [
      anchor.utils.bytes.utf8.encode(TOKEN_VAULT_PDA_SEED),
      tokenMint.toBuffer(),
      ],
      program.programId
  );

  return {
      key: pda,
      bump: bump
  }
}
export const swap = async ({
  program,
  wallet,
  amount,
}: SwapProps) => {
  let swapPoolPDA = await getSwapPoolPDA(program);
  let tokenVaultPDA = await getTokenVaultPDA(program);
  let userTokenAccount = await getAtaAccount(wallet.publicKey);

  console.log(wallet)
  console.log(amount)
  console.log(`Program id: ${program.programId.toBase58()}`)
  await program.rpc.swap(amount, {
    accounts: {
      user: wallet.publicKey,
      swapPool: swapPoolPDA.key,
      tokenMint: tokenMint, 
      tokenVault: tokenVaultPDA.key, 
      userTokenAccount: userTokenAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID
    },
    signers: [],
  });
};
