"use client";

import { useConnect, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";
import { clsx } from "clsx";

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnect({ className }: { className?: string }) {
  const { address, isConnected, chainId } = useConnection();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();

  const shell =
    "type-label px-3 py-2 transition-colors duration-150";

  if (isConnected && address) {
    if (chainId !== mainnet.id) {
      return (
        <button
          type="button"
          onClick={() => switchChain({ chainId: mainnet.id })}
          disabled={isSwitching}
          className={clsx(shell, "bg-claim text-field-deep hover:bg-claim-deep", className)}
        >
          {isSwitching ? "Switching…" : "Switch to Ethereum"}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect wallet"
        className={clsx(shell, "flex items-center gap-2 text-chalk ring-1 ring-rule-strong ring-inset hover:bg-chalk hover:text-field-deep", className)}
      >
        <span className="h-1.5 w-1.5 bg-claim" />
        {short(address)}
      </button>
    );
  }

  const injectedConnector = connectors[0];

  return (
    <button
      type="button"
      disabled={!injectedConnector || isConnecting}
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      className={clsx(shell, "bg-chalk text-field-deep hover:bg-claim hover:text-field-deep disabled:bg-transparent disabled:text-chalk-muted disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset", className)}
    >
      {isConnecting ? "Connecting…" : injectedConnector ? "Connect wallet" : "No wallet found"}
    </button>
  );
}
