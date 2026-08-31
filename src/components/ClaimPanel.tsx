"use client";

import { formatEther, parseEther } from "viem";
import {
  useConnect,
  useConnection,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import type { Parcel } from "@/components/WorldMap";
import { plotlandAbi } from "@/lib/plotlandAbi";
import { canClaim, claimConfig, world } from "@/lib/site-config";

const priceWei =
  claimConfig.priceEth !== null ? parseEther(claimConfig.priceEth) : null;

export function ClaimPanel({
  parcel,
  isClaimed,
}: {
  parcel: Parcel | null;
  isClaimed: boolean;
}) {
  const { isConnected, chainId } = useConnection();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();
  const {
    writeContract,
    data: hash,
    isPending: isSigning,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const wrongNetwork = isConnected && chainId !== mainnet.id;

  const handleClaim = () => {
    if (
      !canClaim ||
      parcel === null ||
      claimConfig.contractAddress === null ||
      priceWei === null
    ) {
      return;
    }
    writeContract({
      address: claimConfig.contractAddress,
      abi: plotlandAbi,
      functionName: "claim",
      args: [BigInt(parcel.id)],
      value: priceWei,
      chainId: mainnet.id,
    });
  };

  return (
    <div className="border border-rule-strong bg-field-raised">
      <div className="border-b border-rule px-4 py-3">
        <Label className="text-chalk">Claim a parcel</Label>
      </div>

      <div className="px-4 py-4">
        {parcel === null ? (
          <p className="type-body text-chalk-soft">
            Pick any open hexagon on the map. Every parcel is the same amount
            of ground — the projection is equal-area, so a hexagon in Norway
            covers exactly what one in Kenya does.
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="type-figure text-chalk">
                {String(parcel.id).padStart(3, "0")}
              </span>
              <Label className={isClaimed ? "text-claim-deep" : "text-chalk-soft"}>
                {isClaimed ? "Already claimed" : "Open ground"}
              </Label>
            </div>

            <dl className="mt-4 border-t border-rule pt-3">
              <div className="flex items-center justify-between py-1.5">
                <dt>
                  <Label>Territory</Label>
                </dt>
                <dd className="type-data text-chalk">{parcel.country}</dd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <dt>
                  <Label>Region</Label>
                </dt>
                <dd className="type-data text-chalk">
                  {parcel.continent || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <dt>
                  <Label>Dry ground</Label>
                </dt>
                <dd className="type-data text-chalk">
                  {Math.round(parcel.land * 100)}%
                </dd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <dt>
                  <Label>Price</Label>
                </dt>
                <dd className="type-data text-chalk">
                  {priceWei !== null ? `${formatEther(priceWei)} ETH` : "Not set"}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>

      <div className="border-t border-rule px-4 py-4">
        {!canClaim ? (
          /*
           * Pre-launch. The wallet still connects — being ready is the one
           * useful thing to do here — but there is no contract to call yet,
           * so the claim itself stays disabled rather than looking live and
           * doing nothing.
           */
          <>
            {isConnected ? (
              <Button disabled className="w-full">
                Claiming opens at launch
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={!connectors[0] || isConnecting}
                onClick={() =>
                  connectors[0] && connect({ connector: connectors[0] })
                }
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </Button>
            )}
            <p className="type-data mt-3 text-chalk-soft">
              {isConnected
                ? "You are set. Claiming opens a few minutes after launch."
                : "Claiming opens a few minutes after launch. Connect now so you are ready when it does."}
            </p>
          </>
        ) : !isConnected ? (
          <Button
            className="w-full"
            disabled={!connectors[0] || isConnecting}
            onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          >
            {isConnecting ? "Connecting…" : "Connect wallet to claim"}
          </Button>
        ) : wrongNetwork ? (
          <Button
            className="w-full"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: mainnet.id })}
          >
            {isSwitching ? "Switching…" : "Switch to Ethereum"}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={parcel === null || isClaimed || isSigning || isConfirming}
            onClick={handleClaim}
          >
            {parcel === null
              ? "Pick a parcel"
              : isClaimed
                ? "Taken"
                : isSigning
                  ? "Confirm in wallet…"
                  : isConfirming
                    ? "Claiming…"
                    : `Claim parcel ${String(parcel.id).padStart(3, "0")}`}
          </Button>
        )}

        {isSuccess && (
          <p className="type-data mt-3 text-chalk">
            Claimed. The map will show it on the next read.
          </p>
        )}
        {writeError && (
          <p className="type-data mt-3 text-claim-deep">
            {writeError.message.split("\n")[0]}
          </p>
        )}

        <p className="type-label mt-4 text-chalk-muted">
          Max {world.maxPerWallet} per wallet · Ethereum mainnet
        </p>
      </div>
    </div>
  );
}
