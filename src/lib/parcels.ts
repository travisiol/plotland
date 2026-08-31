import parcelData from "@/data/parcels.json";
import coastlineData from "@/data/coastline.json";

/*
 * The 999 plots and the coastline they sit on, generated once by
 * scripts/build-parcels.py and committed. Nothing is projected or fetched
 * at runtime.
 *
 * This lives apart from the map component so the market layer can read the
 * plot list without importing the canvas — they would otherwise import
 * each other.
 */

export interface Parcel {
  id: number;
  x: number;
  y: number;
  country: string;
  continent: string;
  land: number;
}

export const parcels = parcelData.parcels as Parcel[];
export const coastRings = coastlineData.rings as [number, number][][];
export const bounds = parcelData.bounds as [number, number, number, number];
export const HEX_RADIUS = parcelData.hexRadius as number;

/** Flat-top hex: vertices every 60° starting at 0°. */
export const HEX_ANGLES = [0, 1, 2, 3, 4, 5].map((k) => (Math.PI / 3) * k);

const byId = new Map(parcels.map((parcel) => [parcel.id, parcel]));
export function parcelById(id: number): Parcel | undefined {
  return byId.get(id);
}
