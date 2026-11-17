export type CityGeo = {
  city: string;
  country: string;
  lat: number;
  lon: number;
  code: string; // airport code
  rail: boolean; // served by Pakistan Railways mainline
  airport: string;
};

export const CITIES: CityGeo[] = [
  { city: "Karachi", country: "Pakistan", lat: 24.86, lon: 67.01, code: "KHI", rail: true, airport: "Jinnah International" },
  { city: "Lahore", country: "Pakistan", lat: 31.55, lon: 74.34, code: "LHE", rail: true, airport: "Allama Iqbal International" },
  { city: "Islamabad", country: "Pakistan", lat: 33.68, lon: 73.05, code: "ISB", rail: true, airport: "Islamabad International" },
  { city: "Rawalpindi", country: "Pakistan", lat: 33.6, lon: 73.07, code: "ISB", rail: true, airport: "Islamabad International" },
  { city: "Murree", country: "Pakistan", lat: 33.9, lon: 73.39, code: "ISB", rail: false, airport: "Islamabad International" },
  { city: "Gilgit", country: "Pakistan", lat: 35.92, lon: 74.31, code: "GIL", rail: false, airport: "Gilgit Airport" },
  { city: "Hunza", country: "Pakistan", lat: 36.32, lon: 74.66, code: "GIL", rail: false, airport: "Gilgit Airport" },
  { city: "Skardu", country: "Pakistan", lat: 35.29, lon: 75.63, code: "KDU", rail: false, airport: "Skardu Airport" },
  { city: "Multan", country: "Pakistan", lat: 30.2, lon: 71.47, code: "MUX", rail: true, airport: "Multan International" },
  { city: "Peshawar", country: "Pakistan", lat: 34.02, lon: 71.58, code: "PEW", rail: true, airport: "Bacha Khan International" },
  { city: "Quetta", country: "Pakistan", lat: 30.18, lon: 66.99, code: "UET", rail: true, airport: "Quetta International" },
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2, lon: 55.27, code: "DXB", rail: false, airport: "Dubai International" },
  { city: "Bangkok", country: "Thailand", lat: 13.76, lon: 100.5, code: "BKK", rail: false, airport: "Suvarnabhumi" },
  { city: "Istanbul", country: "Türkiye", lat: 41.01, lon: 28.98, code: "IST", rail: false, airport: "Istanbul Airport" },
];

export const findCity = (name: string) =>
  CITIES.find((c) => c.city.toLowerCase() === name.trim().toLowerCase());

export const isPakistan = (name: string) => findCity(name)?.country === "Pakistan";

export function haversineKm(a: CityGeo, b: CityGeo) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.22);
}

// real-ish road distances for common PK pairs (km)
const ROAD_OVERRIDE: Record<string, number> = {
  "karachi|lahore": 1225,
  "karachi|islamabad": 1420,
  "karachi|rawalpindi": 1420,
  "karachi|murree": 1445,
  "karachi|hunza": 1800,
  "karachi|skardu": 1880,
  "lahore|islamabad": 375,
  "lahore|rawalpindi": 380,
  "lahore|murree": 435,
  "lahore|hunza": 800,
  "lahore|skardu": 960,
  "islamabad|murree": 65,
  "rawalpindi|murree": 62,
  "islamabad|hunza": 600,
  "islamabad|skardu": 700,
  "islamabad|gilgit": 590,
  "hunza|skardu": 205,
  "hunza|gilgit": 100,
  "skardu|gilgit": 230,
  "lahore|multan": 340,
  "karachi|quetta": 690,
};

export function roadKm(from: string, to: string) {
  const key = `${from.toLowerCase()}|${to.toLowerCase()}`;
  const rev = `${to.toLowerCase()}|${from.toLowerCase()}`;
  if (ROAD_OVERRIDE[key]) return ROAD_OVERRIDE[key];
  if (ROAD_OVERRIDE[rev]) return ROAD_OVERRIDE[rev];
  const a = findCity(from);
  const b = findCity(to);
  if (!a || !b) return 500;
  return haversineKm(a, b);
}

export function roadHours(km: number) {
  // mountain roads are slower
  const avg = km > 500 ? 52 : km > 150 ? 62 : 45;
  return km / avg;
}
