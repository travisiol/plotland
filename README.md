# PLOTLAND

The world's land cut into 999 equal parcels. Claim one on the map.

`PLOTLAND` is a placeholder name — it is one string in `src/lib/site-config.ts`
plus the `NEXT_PUBLIC_PLOTLAND_*` env prefix, so renaming is a two-line change.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · wagmi v3 + viem ·
TypeScript. Injected wallets only, Ethereum mainnet, no backend.

## The map is the product

`src/components/WorldMap.tsx` draws the coastline and all 999 hex parcels on a
canvas and colours only the ground that has actually been claimed. It is the
artwork, the proof of scarcity and the claim counter at once, which is why it
is the only place on the page allowed to use colour.

Geometry is generated once and committed — nothing is fetched at build or run
time:

```bash
python scripts/build-parcels.py
```

That script reads Natural Earth's public-domain 110m land and country files
(committed next to it) and writes `src/data/parcels.json` and
`src/data/coastline.json`.

**Why an equal-area projection.** Parcels have to be genuinely equal or "one
parcel" means nothing. The grid is laid in Equal Earth, which is equal-area, so
every hexagon covers the same amount of planet. On a lat/lon grid a parcel in
Norway would quietly be worth a fraction of one in Kenya.

**How it lands on exactly 999.** A binary search on the hex radius finds the
smallest lattice with at least 999 land cells, then the overshoot is dropped
lowest-land-fraction first — which shaves coastal slivers rather than punching
holes inland. Parcels are numbered north to south.

The counts that fall out of this are facts about area, not editorial choices:
Russia holds 108 parcels, Antarctica 97, Canada 71, the United States 64.

## The contract this page expects

The ABI in `src/lib/plotlandAbi.ts` is specced around the map rather than the
other way round:

| Function | Why |
| --- | --- |
| `claim(uint256 parcelId) payable` | Claiming is by id, so you take the ground you picked rather than whatever the next mint hands you. |
| `claimedBitmap() view returns (uint256[4])` | The map needs all 999 states every time it draws. 999 bits pack into four words, so that is one view call instead of 999 `ownerOf` lookups or an indexer. Bit *n* of word *n >> 8* is parcel *n + 1*. |
| `totalSupply() view returns (uint256)` | Claim count. |

If the deployed contract names these differently, that one file is the only
thing to change.

## Pre-launch state

The site ships before the contract does, so it runs entirely on env vars:

- The map draws a seeded starting state behind a `PRE-LAUNCH` tag. Those claims
  are not on-chain — the tag is what keeps the claim count from asserting
  activity that has not happened. They are spread across the numbering because
  parcels run north to south, so the first three would all sit in the arctic.
- Wallets connect. There is no contract to call yet, so the claim button itself
  stays disabled and says "Claiming opens at launch" rather than looking live
  and doing nothing.
- Everything flips automatically once `NEXT_PUBLIC_PLOTLAND_CONTRACT_ADDRESS`,
  `NEXT_PUBLIC_PLOTLAND_PRICE_ETH` and `NEXT_PUBLIC_PLOTLAND_LIVE=true` exist:
  the tag disappears, the figures read the chain, the button claims. No code
  change.
- No yield rate, holder count, floor, valuation or launch date appears
  anywhere. None of it is decided, and inventing a figure here is the one thing
  on this page a holder could actually be hurt by.

## Setup

```bash
npm install
cp .env.example .env.local   # optional — it runs with no env at all
npm run dev
```

## Going live

1. Deploy a contract exposing the three functions above.
2. Set `NEXT_PUBLIC_PLOTLAND_CONTRACT_ADDRESS`, `NEXT_PUBLIC_PLOTLAND_PRICE_ETH`
   and `NEXT_PUBLIC_PLOTLAND_LIVE=true`.
3. Set `NEXT_PUBLIC_MAINNET_RPC_URL` to a private endpoint — the public mainnet
   RPC will rate-limit under real traffic, and the map polls the bitmap every
   20 seconds.
4. Set `NEXT_PUBLIC_SITE_URL` so metadata, `sitemap.xml` and `robots.txt` point
   at the real domain.

Social links stay hidden until their env vars are set, so no dead link ships.

## Art direction

A survey drawing: white line work on Prussian blue, the way a cyanotype sheet
prints, with a surveyor's chalk yellow reserved for marks made in the field.
Yellow appears only on claimed ground — on a map of 999 identical hexagons,
colour has to mean ownership or it means nothing.

Technical drawings letter their title blocks in the same hand they annotate
with, so the display face here is the mono — IBM Plex Mono set large, tracked
wide, in caps — with IBM Plex Sans carrying prose. The title strip along the
bottom of the map states the projection, the source and the grid, which is
provenance most mint sites never print.

## Attribution

Coastlines and country boundaries from [Natural Earth](https://www.naturalearthdata.com/),
public domain. Projection: Equal Earth (Šavrič, Patterson & Jenny, 2018).

## Verification

`npx tsc --noEmit`, `npx eslint` and `npx next build` all pass clean.
