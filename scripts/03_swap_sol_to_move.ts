import { Swapper } from "./swap/swapper";
import * as anchor from "@project-serum/anchor";
import { getAtaAccount, getSplBalance, transferToken } from "./utils/token";
import { promises as fsPromises } from "fs";
import { SAVE_PATH } from "./utils/const";

const main = async () => {
  const deployedAddress = JSON.parse((await fsPromises.readFile(SAVE_PATH)).toString());

  const swap_token = new anchor.web3.PublicKey(deployedAddress["MOVE_TOKEN"]);
  const swapper = new Swapper(swap_token);

  let deployerATA = await getAtaAccount(swap_token, swapper.deployer.publicKey);

  const deployerInfo = await swapper.provider.connection.getAccountInfo(swapper.deployer.publicKey);
  const preDeployerSolBalance = deployerInfo.lamports;

  const preDeployerMoveBalance = await getSplBalance(swapper.provider, deployerATA);

  console.log("Deployer ATA MOVE balance: ", preDeployerMoveBalance.toString());
  console.log("Deployer SOL balance: ", preDeployerSolBalance.toString());

  let swapAmount = new anchor.BN(1000000000); // 1 SOL -> get 10 MOVE
  console.log("Swapping 1 SOL to MOVE...");
  const txSignature = await swapper.swap(swapper.deployer, deployerATA, swapAmount, true);

  // Wait for the transaction to be confirmed
  await swapper.provider.connection.confirmTransaction(txSignature, "finalized");

  console.log("Transaction confirmation:", txSignature);

  const postDeployerMoveBalance = await getSplBalance(swapper.provider, deployerATA);
  const postDeployerSolBalance = (await swapper.provider.connection.getAccountInfo(swapper.deployer.publicKey))
    .lamports;

  console.log("Deployer ATA MOVE balance: ", postDeployerMoveBalance.toString());
  console.log("Deployer SOL balance: ", postDeployerSolBalance.toString());
};

main().catch((error) => console.log(error));
