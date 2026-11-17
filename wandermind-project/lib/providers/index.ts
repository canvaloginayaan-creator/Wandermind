import { mockProvider } from "./mock";
import { LiveTravelProvider, liveConfig } from "./live";
import type { TravelProvider } from "./types";

let cached: TravelProvider | null = null;

export function getProvider(): TravelProvider {
  if (cached) return cached;
  if (liveConfig().amadeus) {
    cached = new LiveTravelProvider(mockProvider);
  } else {
    cached = mockProvider;
  }
  return cached;
}

export { liveConfig };
export type { TravelProvider } from "./types";
export type {
  FlightOption,
  IntercityOption,
  StayOption,
} from "./types";
