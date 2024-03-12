import { Swapper } from "./swap/swapper";
import * as anchor from "@project-serum/anchor";

import { promises as fsPromises } from "fs";
import { SAVE_PATH } from "./utils/const";
import { getAtaAccount, getSplBalance } from "./utils/token";

const main = async () => {
  const deployedAddress = JSON.parse((await fsPromises.readFile(SAVE_PATH)).toString());

  const swap_token = new anchor.web3.PublicKey(deployedAddress["MOVE_TOKEN"]);
  const swapper = new Swapper(swap_token);

  const preDeployerSolBalance = (await swapper.provider.connection.getAccountInfo(swapper.deployer.publicKey)).lamports;
  console.log("Deployer SOL balance: ", preDeployerSolBalance.toString());

  let deployerATA = await getAtaAccount(swap_token, swapper.deployer.publicKey);
  console.log("Closing the swap pool...");
  const txSignature = await swapper.closePool(swapper.deployer, deployerATA);
  // Wait for the transaction to be confirmed
  await swapper.provider.connection.confirmTransaction(txSignature, "finalized");

  console.log("Transaction confirmation:", txSignature);

  const deployerMoveBalance = await getSplBalance(swapper.provider, deployerATA);

  console.log("Deployer ATA MOVE balance: ", deployerMoveBalance.toString());

  const postDeployerSolBalance = (await swapper.provider.connection.getAccountInfo(swapper.deployer.publicKey))
    .lamports;
  console.log("Deployer SOL balance: ", postDeployerSolBalance.toString());
};

main().catch((error) => console.log(error));
