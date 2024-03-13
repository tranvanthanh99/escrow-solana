import { Swapper } from "./swap/swapper";
import * as anchor from "@project-serum/anchor";
import { getAtaAccount, getSplBalance, transferSol, transferToken } from "./utils/token";
import { promises as fsPromises } from "fs";
import { SAVE_PATH } from "./utils/const";

const MOVE_PRICE = [new anchor.BN(10), new anchor.BN(1)]; // 1 move = 0.1 SOL

const main = async () => {
  const deployedAddress = JSON.parse((await fsPromises.readFile(SAVE_PATH)).toString());
  console.log(deployedAddress);

  const swap_token = new anchor.web3.PublicKey(deployedAddress["MOVE_TOKEN"]);
  const swapper = new Swapper(swap_token);

  console.log("signer", swapper.deployer.publicKey.toBase58());

  // initialize the swap pool
  console.log("Initializing the swap pool...");
  const txSignature = await swapper.initialize(swapper.deployer, MOVE_PRICE);

  // Wait for the transaction to be confirmed
  await swapper.provider.connection.confirmTransaction(txSignature, "finalized");

  console.log("Transaction confirmation:", txSignature);

  const tokenVaultPDA = await swapper.getTokenVaultPDA();

  const deployerATA = await getAtaAccount(swap_token, swapper.deployer.publicKey);
  const depositAmount = 100000000000; // 100,000 MOVE
  console.log("Depositing 100,000 MOVE to the token vault...");
  await transferToken(swapper.provider, deployerATA, tokenVaultPDA.key, swapper.deployer, depositAmount);

  const swapPoolPDA = await swapper.getSwapPoolPDA();

  console.log("Depositing 5 Sol to the swap pool...");
  await transferSol(swapper.provider, swapPoolPDA.key, 5000000000); // 5 Sol

  const tokenVaultMoveBalance = await getSplBalance(swapper.provider, tokenVaultPDA.key);
  const deployerMoveBalance = await getSplBalance(swapper.provider, deployerATA);

  const poolRentFee = await swapper.getSwapPoolRentExemptLamports();

  console.log("Swap pool Sol balance: ", (await swapper.provider.connection.getBalance(swapPoolPDA.key)) - poolRentFee);

  console.log("Token Vault MOVE balance: ", tokenVaultMoveBalance.toString());
  console.log("Deployer ATA MOVE balance: ", deployerMoveBalance.toString());
};

main().catch((error) => console.log(error));
