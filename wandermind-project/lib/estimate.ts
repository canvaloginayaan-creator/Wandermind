import { findDestination } from "./data/places";
import { roadKm } from "./data/geo";
import { isPakistan } from "./data/geo";

/* ------------------------------------------------------------------ */
/* Budget-only estimation (used by the explore page)                   */
/* ------------------------------------------------------------------ */

export function estimateTrip(city: string, days: number, travelers: number, fromCity: string) {
  const dest = findDestination(city);
  const band = dest?.daily_band ?? 11000;
  const km = roadKm(fromCity, city);
  const flight = isPakistan(city) ? 12500 + km * 12 : 52000 + km * 3;
  const ground = km * 3.1;
  const transport = Math.min(flight, ground < 2000 ? ground : flight);
  const stay = band * 0.55 * Math.max(1, days - 1);
  const food = band * 0.42 * days;
  const act = band * 0.2 * days;
  return Math.round((transport * 2 + stay + food + act) * travelers * 0.96);
}
