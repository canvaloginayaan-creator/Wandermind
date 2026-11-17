/**
 * Live adapters. These are real HTTP integrations that activate purely from
 * environment variables — no code changes required. If a key is missing (or the
 * upstream call fails) every method returns null and the caller falls back to
 * the deterministic mock provider, so the app never breaks.
 *
 * Supported today:
 *   AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET  -> flight offers
 *   GOOGLE_PLACES_API_KEY                      -> restaurants / POIs
 *   UNSPLASH_ACCESS_KEY                        -> destination photography
 */

import type { FlightOption, StayOption, IntercityOption, TravelProvider } from "./types";
import { findCity } from "../data/geo";
import { flightBookingUrl } from "./mock";

export const liveConfig = () => ({
  amadeus: Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET),
  places: Boolean(process.env.GOOGLE_PLACES_API_KEY),
  unsplash: Boolean(process.env.UNSPLASH_ACCESS_KEY),
  llm: Boolean(
    (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY) &&
      process.env.ENABLE_LLM !== "false"
  ),
  flightsProvider: process.env.FLIGHTS_PROVIDER ?? "mock",
  placesProvider: process.env.PLACES_PROVIDER ?? "mock",
});

let tokenCache: { token: string; exp: number } | null = null;

async function amadeusToken(): Promise<string | null> {
  if (!liveConfig().amadeus) return null;
  if (tokenCache && tokenCache.exp > Date.now() + 30_000) return tokenCache.token;
  try {
    const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token: string; expires_in: number };
    tokenCache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
    return tokenCache.token;
  } catch {
    return null;
  }
}

const CABIN: Record<string, string> = {
  economy: "ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
};

export async function amadeusFlights(input: {
  fromCity: string;
  toCity: string;
  date: string;
  travelers: number;
  cabin?: string;
}): Promise<FlightOption[] | null> {
  const token = await amadeusToken();
  const from = findCity(input.fromCity);
  const to = findCity(input.toCity);
  if (!token || !from || !to) return null;
  try {
    const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
    url.searchParams.set("originLocationCode", from.code);
    url.searchParams.set("destinationLocationCode", to.code);
    url.searchParams.set("departureDate", input.date);
    url.searchParams.set("adults", String(Math.max(1, input.travelers)));
    url.searchParams.set("max", "8");
    url.searchParams.set("currencyCode", "PKR");
    url.searchParams.set("travelClass", CABIN[input.cabin ?? "economy"] ?? "ECONOMY");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const carriers: Record<string, string> = json?.dictionaries?.carriers ?? {};
    const offers = (json?.data ?? []) as any[];
    if (!offers.length) return null;
    return offers.map((o, i): FlightOption => {
      const it = o.itineraries[0];
      const seg = it.segments[0];
      const last = it.segments[it.segments.length - 1];
      const code = seg.carrierCode as string;
      const price = Number(o.price?.grandTotal ?? 0);
      return {
        id: `am_${o.id ?? i}`,
        airline: carriers[code] ?? code,
        airline_code: code,
        flight_no: `${code}${seg.number}`,
        from_city: input.fromCity,
        from_code: seg.departure.iataCode,
        to_city: input.toCity,
        to_code: seg.arrival.iataCode,
        depart_date: seg.departure.at.slice(0, 10),
        arrive_date: last.arrival.at.slice(0, 10),
        depart_time: seg.departure.at.slice(11, 16),
        arrive_time: last.arrival.at.slice(11, 16),
        duration_min: parseDuration(it.duration),
        stops: it.segments.length - 1,
        cabin: (o.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? "ECONOMY")
          .replace("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (c: string) => c.toUpperCase()) as FlightOption["cabin"],
        price,
        currency: "PKR",
        baggage: o.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity
          ? `${o.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity}kg checked`
          : "Baggage per fare rules",
        refundable: false,
        provider_name: "Amadeus (live)",
        booking_url: flightBookingUrl(from.code, to.code, input.date, input.cabin, "PKR"),
        booking_label: "Compare & book",
        is_live: true,
      };
    });
  } catch {
    return null;
  }
}

function parseDuration(iso: string) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso || "");
  return (Number(m?.[1] ?? 0) || 0) * 60 + (Number(m?.[2] ?? 0) || 0);
}

export type LivePlace = {
  name: string;
  address: string;
  rating: number | null;
  user_ratings_total: number | null;
  price_level: number | null;
  photo: string | null;
  map_url: string;
  website: string | null;
  hours: string | null;
  lat: number;
  lng: number;
};

export async function googlePlaces(
  query: string,
  city: string
): Promise<LivePlace[] | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", `${query} in ${city}`);
    url.searchParams.set("key", key);
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    if (json.status !== "OK") return null;
    return (json.results ?? []).slice(0, 8).map((r: any) => ({
      name: r.name,
      address: r.formatted_address ?? "",
      rating: r.rating ?? null,
      user_ratings_total: r.user_ratings_total ?? null,
      price_level: r.price_level ?? null,
      photo: r.photos?.[0]?.photo_reference
        ? `/api/photo?ref=${encodeURIComponent(r.photos[0].photo_reference)}&w=900`
        : null,
      map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        r.name
      )}&query_place_id=${r.place_id}`,
      website: null,
      hours: r.opening_hours?.open_now === true ? "Open now" : null,
      lat: r.geometry?.location?.lat ?? 0,
      lng: r.geometry?.location?.lng ?? 0,
    }));
  } catch {
    return null;
  }
}

/** Amadeus-backed provider wrapper — falls through to mock per-call. */
export class LiveTravelProvider implements TravelProvider {
  name = "Live (Amadeus)";
  isLive = true;
  constructor(private fallback: TravelProvider) {}

  async searchFlights(input: any): Promise<FlightOption[]> {
    const live = await amadeusFlights(input);
    if (live && live.length) return live;
    return this.fallback.searchFlights(input);
  }
  async searchFlightsRange(input: any): Promise<FlightOption[]> {
    const out = await this.searchFlights({ ...input, date: input.startDate });
    const back = await this.searchFlights({
      ...input,
      fromCity: input.toCity,
      toCity: input.fromCity,
      date: input.endDate,
    });
    return [...out, ...back];
  }
  async searchIntercity(input: any): Promise<IntercityOption[]> {
    return this.fallback.searchIntercity(input);
  }
  async searchStays(input: any): Promise<StayOption[]> {
    return this.fallback.searchStays(input);
  }
}
