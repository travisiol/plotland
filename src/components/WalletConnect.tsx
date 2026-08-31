"use client";

import { useConnect, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { robinhoodChain } from "@/lib/chain";
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
    if (chainId !== robinhoodChain.id) {
      return (
        <button
          type="button"
          onClick={() => switchChain({ chainId: robinhoodChain.id })}
          disabled={isSwitching}
          className={clsx(shell, "bg-gold text-void hover:bg-gold-bright", className)}
        >
          {isSwitching ? "Switching…" : "Switch to Robinhood Chain"}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect wallet"
        className={clsx(shell, "flex items-center gap-2 text-chalk ring-1 ring-rule-strong ring-inset hover:bg-chalk hover:text-void", className)}
      >
        <span className="h-1.5 w-1.5 bg-gold" />
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
      className={clsx(shell, "bg-gold text-void hover:bg-gold-bright disabled:bg-transparent disabled:text-chalk-muted disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset", className)}
    >
      {isConnecting ? "Connecting…" : injectedConnector ? "Connect wallet" : "No wallet found"}
    </button>
  );
}
