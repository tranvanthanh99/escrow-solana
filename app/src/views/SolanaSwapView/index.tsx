import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FC, useEffect, useRef, useState } from "react";

import * as anchor from "@project-serum/anchor";
import { SelectAndConnectWalletButton } from "components";

import { SolanaLogo } from "components";
import styles from "./index.module.css";
import { swap } from "./swap";
import { useProgram } from "./useProgram";
import TokenReserve from "./TokenReserve";

const endpoint = "https://explorer-api.devnet.solana.com";

export const connection = new anchor.web3.Connection(endpoint);

export const SolanaSwapView: FC = ({}) => {
  const [isAirDropped, setIsAirDropped] = useState(false);
  const wallet: any = useAnchorWallet();
  const txRef = useRef<any>(null);

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
          <div className="flex-none">
            <button className="btn btn-square btn-ghost">
              <span className="text-4xl">🦊</span>
            </button>
          </div>
          <div className="flex-1 px-2 mx-2">
            <div className="text-sm breadcrumbs">
              <ul className="text-xl">
                <li>
                  <span className="opacity-40">tranvanthanh99</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex-none">
            <WalletMultiButton className="btn btn-ghost" />
          </div>
        </div>

        <div className="text-center pt-2">
          <div className="hero min-h-16 pt-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">
                  Swap SOL for MOVE
                  {/* <SolanaLogo /> */}
                </h1>

                <p>1 SOL = 10 MOVE</p>
              </div>
            </div>
          </div>
          <div className="text-center pt-2 mb-2">
            <TokenReserve />
          </div>
        </div>

        <div className="flex justify-center">
          {!wallet ? <SelectAndConnectWalletButton onUseWalletClick={() => {}} /> : <SwapScreen txRef={txRef} />}
        </div>
        <div className="flex justify-center items-center text-center" style={{ color: "greenyellow" }}>
          <p>
            <span ref={txRef}></span>
          </p>
        </div>
      </div>
    </div>
  );
};

const SwapScreen = ({ txRef }: { txRef: any }) => {
  const wallet: any = useAnchorWallet();
  const [swaps, setSwaps] = useState<unknown[]>([]);
  const { program } = useProgram({ connection, wallet });
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number>();

  useEffect(() => {}, [wallet, lastUpdatedTime]);

  const onSwapSent = (swapEvent: unknown) => {
    setSwaps((prevState) => ({
      ...prevState,
      swapEvent,
    }));
  };

  return (
    <div className="rounded-lg flex justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="text-xs">
          <NetSwap onSwapSent={onSwapSent} txRef={txRef} />
        </div>
      </div>
    </div>
  );
};

type NetSwap = {
  onSwapSent: (t: any) => void;
  txRef?: any;
};

const NetSwap: FC<NetSwap> = ({ onSwapSent, txRef }) => {
  const wallet: any = useAnchorWallet();
  const { program } = useProgram({ connection, wallet });
  const [solVal, setSolVal] = useState<any>(0);
  const [moveVal, setMoveVal] = useState<any>(0);

  //Sol -> move
  const onSwapClick = async () => {
    if (!program) return;

    txRef.current.innerText = "";

    const amount = new anchor.BN(Number(solVal) * 10 ** 9);

    const swap_result = await swap({
      program,
      wallet,
      amount,
      solToMove: true,
    });

    if (swap_result !== null) {
      txRef.current.innerText = `Tx hash: ${swap_result}`;
    }

    console.log("New swap transaction succeeded: ", swap_result);

    onSwapSent(swap_result);
  };

  //Move -> Sol
  const onSwapClick2 = async () => {
    if (!program) return;

    txRef.current.innerText = "";

    const moveAmount = new anchor.BN(Number(moveVal) * 10 ** 6);

    const swap_result = await swap({
      program,
      wallet,
      amount: moveAmount,
      solToMove: false,
    });

    if (swap_result !== null) {
      txRef.current.innerText = `Tx hash: ${swap_result}`;
    }

    console.log("New swap transaction succeeded: ", swap_result);

    onSwapSent(swap_result);
  };
  function isNumeric(value: any) {
    return /^[0-9]{0,9}(\.[0-9]{1,2})?$/.test(value);
  }

  return (
    <div style={{ minWidth: 240 }} className="mb-8 pb-4 border-b border-gray-500 flex ">
      <div className="flex flex-col  w-full ">
        <div className="w-full">
          <input
            value={solVal}
            onChange={(e) => {
              const value = e.target.value;
              console.log(value);
              setSolVal(value);
            }}
            placeholder="Enter the SOL amount"
            className="mb-4"
          ></input>
          <button
            className="btn btn-primary rounded-full normal-case	w-full"
            onClick={onSwapClick}
            style={{ minHeight: 0, height: 40 }}
          >
            Swap Solana for Move
          </button>
        </div>
        <div className="w-full mt-3">
          <input
            value={moveVal}
            onChange={(e) => {
              const value = e.target.value;
              console.log(value);
              setMoveVal(value);
            }}
            placeholder="Enter the SOL amount"
            className="mb-4"
          ></input>
          <button
            className="btn btn-primary rounded-full normal-case	w-full"
            onClick={onSwapClick2}
            style={{ minHeight: 0, height: 40 }}
          >
            Swap Move for Solana
          </button>
        </div>
      </div>
    </div>
  );
};
