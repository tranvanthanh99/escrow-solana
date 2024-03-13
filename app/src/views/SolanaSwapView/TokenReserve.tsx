import React, { useEffect, useRef, useState } from "react";
import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import { getSwapPoolPDA, getTokenVaultPDA } from "./swap";

import { env } from "./data";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { connection } from ".";

const tokenMint = new anchor.web3.PublicKey(env.swap_token);
const PROGRAM_ID = new anchor.web3.PublicKey(env.program_id);
const SWAP_POOL_SIZE = 121;

type Props = {};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchTokenReserve = async () => {
  // console.log("========== fetchTokenReserve", program);
  const tokenVaultPDA = await getTokenVaultPDA(PROGRAM_ID);
  const swapPoolPDA = await getSwapPoolPDA(PROGRAM_ID);

  const tokenVaultInfo = await spl.getAccount(connection, tokenVaultPDA.key);
  const swapPoolInfo = await connection.getAccountInfo(swapPoolPDA.key);

  const poolRentFee = await connection.getMinimumBalanceForRentExemption(SWAP_POOL_SIZE);
  // const reserveMove = await get

  return {
    reserveSol: (swapPoolInfo?.lamports ?? 0) - poolRentFee,
    reserveMove: tokenVaultInfo.amount,
  };
};

const fakeCallBlockchain = async () => {
  await sleep(2000);

  return await fetchTokenReserve();
};

const TokenReserve = ({}: Props) => {
  const wallet: any = useAnchorWallet();
  // const { program } = useProgram({ connection, wallet });
  const solRef = useRef<any>(null);

  const moveRef = useRef<any>(null);
  useEffect(() => {
    // .on('event', (data) => {
    //   solRef.current.innerText = data;
    // })
    // let i = 0;
    (async () => {
      while (true) {
        const { reserveMove, reserveSol } = await fakeCallBlockchain();
        console.log("reserveMove", reserveMove);
        console.log("reserveSol", new anchor.BN(reserveSol.toString()).div(new anchor.BN(10 ** 9)).toString());
        solRef.current.innerText = reserveSol / 10 ** 9;
        moveRef.current.innerText = parseInt(reserveMove.toString()) / 10 ** 6;
        // i++;
      }
    })();
  }, []);

  return (
    <div>
      Pool Reserve
      <div className="flex justify-center items-center text-center">
        <p>
          Sol:<span ref={solRef}>---</span>
        </p>

        <p className="ml-2">
          Move:<span ref={moveRef}>---</span>
        </p>
      </div>
    </div>
  );
};

export default TokenReserve;
