import React, { useEffect, useRef, useState } from 'react';

type Props = {};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fakeCallBlockchain = async () => {
  await sleep(1000);

  return 100;
};

const TokenReserve = (props: Props) => {
  const solRef = useRef<any>(null);

  const moveRef = useRef<any>(null);
  useEffect(() => {
    // .on('event', (data) => {
    //   solRef.current.innerText = data;
    // })
    let i = 0;
    (async () => {
      while (true) {
        await fakeCallBlockchain();
        solRef.current.innerText = i;
        moveRef.current.innerText = i + 2;
        i++;
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
