import { hash01, minsToDur, addDays } from "../utils";
import { findCity, roadKm, roadHours, isPakistan, CityGeo } from "../data/geo";
import { findDestination } from "../data/places";
import type {
  FlightOption,
  IntercityOption,
  StayOption,
  TravelProvider,
} from "./types";

/* ------------------------------------------------------------------ */
/* Booking deep links — all real, open the live booking engine         */
/* ------------------------------------------------------------------ */

export function flightBookingUrl(
  fromCode: string,
  toCode: string,
  date: string,
  cabin = "economy",
  currency = "PKR"
) {
  const q = encodeURIComponent(`Flights from ${fromCode} to ${toCode} on ${date}`);
  const c = cabin === "business" ? "&curr=" + currency + "&cabin=business" : `&curr=${currency}`;
  return `https://www.google.com/travel/flights?q=${q}${c}`;
}

export function bookingComUrl(
  city: string,
  checkIn: string,
  checkOut: string,
  adults: number
) {
  const params = new URLSearchParams({
    ss: city,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: String(adults),
    no_rooms: "1",
    group_children: "0",
    selected_currency: "PKR",
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function railBookingUrl(from: string, to: string) {
  return `https://www.pakrail.gov.pk/Train-Schedule.aspx`;
}

export function rome2rioUrl(from: string, to: string) {
  const s = `${from.replace(/\s+/g, "-")}/${to.replace(/\s+/g, "-")}`;
  return `https://www.rome2rio.com/s/${encodeURIComponent(s).replace(/%2F/g, "/")}`;
}

export function bookmeUrl(from: string, to: string, date: string) {
  return `https://bookme.pk/`;
}

/* ------------------------------------------------------------------ */
/* Flights                                                             */
/* ------------------------------------------------------------------ */

const AIRLINES = [
  { name: "Pakistan International Airlines", code: "PK", domestic: true, intl: true },
  { name: "Airblue", code: "PA", domestic: true, intl: true },
  { name: "Serene Air", code: "ER", domestic: true, intl: false },
  { name: "AirSial", code: "PF", domestic: true, intl: true },
  { name: "Fly Jinnah", code: "9P", domestic: true, intl: false },
];

const INTL_AIRLINES = [
  { name: "Emirates", code: "EK" },
  { name: "flydubai", code: "FZ" },
  { name: "Qatar Airways", code: "QR" },
  { name: "Turkish Airlines", code: "TK" },
  { name: "Thai Airways", code: "TG" },
  { name: "Etihad Airways", code: "EY" },
  { name: "Saudia", code: "SV" },
  { name: "Oman Air", code: "WY" },
];

function airlineSite(code: string) {
  const map: Record<string, string> = {
    PK: "https://www.piac.com.pk/",
    PA: "https://www.airblue.com/",
    ER: "https://www.sereneair.com/",
    PF: "https://www.airsial.com/",
    "9P": "https://www.flyjinnah.com/",
    EK: "https://www.emirates.com/",
    FZ: "https://www.flydubai.com/",
    QR: "https://www.qatarairways.com/",
    TK: "https://www.turkishairlines.com/",
    TG: "https://www.thaiairways.com/",
    EY: "https://www.etihad.com/",
    SV: "https://www.saudia.com/",
    WY: "https://www.omanair.com/",
  };
  return map[code] ?? "https://www.google.com/travel/flights";
}

const INTL_BASE_FARE: Record<string, number> = {
  DXB: 52000,
  BKK: 82000,
  IST: 98000,
};

function flightDurationMin(from: CityGeo, to: CityGeo, stops: number) {
  const a = from.lat,
    b = to.lat,
    c = from.lon,
    d = to.lon;
  const km =
    2 *
    6371 *
    Math.asin(
      Math.sqrt(
        Math.sin(((b - a) * Math.PI) / 360) ** 2 +
          Math.cos((a * Math.PI) / 180) *
            Math.cos((b * Math.PI) / 180) *
            Math.sin(((d - c) * Math.PI) / 360) ** 2
      )
    );
  const base = 35 + km / 11.5;
  return Math.round(base + stops * 130);
}

function buildFlight(
  from: CityGeo,
  to: CityGeo,
  date: string,
  seed: string,
  opts: { travelers: number; forceAirline?: { name: string; code: string }; cabin?: string }
): FlightOption {
  const code = to.code;
  const intl = !isPakistan(to.city) || !isPakistan(from.city);
  const pool = intl ? INTL_AIRLINES : AIRLINES.filter((a) => a.domestic);
  const stamp = hash01(seed);
  const airline = opts.forceAirline ?? pool[Math.floor(stamp * pool.length) % pool.length];

  const km = Math.round(
    Math.abs(from.lat - to.lat) * 111 + Math.abs(from.lon - to.lon) * 88
  );
  const direct = hash01(seed + "stops") > 0.72 ? 1 : 0;
  const stops = intl ? direct : 0;
  const dur = flightDurationMin(from, to, stops);

  const departHour = Math.floor(hash01(seed + "dh") * 20) + 4;
  const departMin = hash01(seed + "dm") > 0.5 ? 30 : 0;
  const depart_total = departHour * 60 + departMin;
  const arrive_total = depart_total + dur;
  const arriveDayOffset = Math.floor(arrive_total / 1440);
  const arrive_date = addDays(date, arriveDayOffset);

  const baseFare = intl
    ? INTL_BASE_FARE[code] ?? 70000 + km * 12
    : 12500 + km * 12 + hash01(seed + "fare") * 6000;
  const stopDiscount = stops ? 0.86 : 1;
  const bandMult = 0.82 + hash01(seed + "band") * 0.5;
  const timeMult = departHour < 7 || departHour > 21 ? 0.92 : 1.04;
  let price = baseFare * stopDiscount * bandMult * timeMult;
  if (opts.cabin === "business") price *= 2.9;
  price = Math.round(price / 500) * 500;

  return {
    id: `fl_${from.code}${to.code}_${date}_${airline.code}_${Math.round(depart_total)}`,
    airline: airline.name,
    airline_code: airline.code,
    flight_no: `${airline.code}${100 + Math.floor(hash01(seed + "fn") * 800)}`,
    from_city: from.city,
    from_code: from.code,
    to_city: to.city,
    to_code: to.code,
    depart_date: date,
    arrive_date,
    depart_time: `${String(departHour).padStart(2, "0")}:${String(departMin).padStart(2, "0")}`,
    arrive_time: `${String(Math.floor((arrive_total % 1440) / 60)).padStart(2, "0")}:${String(
      arrive_total % 60
    ).padStart(2, "0")}`,
    duration_min: dur,
    stops,
    cabin: opts.cabin === "business" ? "Business" : "Economy",
    price,
    currency: "PKR",
    baggage: intl ? "30kg checked + 7kg cabin" : "20kg checked + 7kg cabin",
    refundable: hash01(seed + "ref") > 0.7,
    provider_name: airline.name,
    booking_url: flightBookingUrl(from.code, to.code, date, opts.cabin, "PKR"),
    booking_label: "Compare & book",
    is_live: false,
  };
}

/* ------------------------------------------------------------------ */
/* Intercity                                                           */
/* ------------------------------------------------------------------ */

const BUS_OPERATORS = [
  { name: "Daewoo Express", url: "https://www.daewoo.com.pk/", comfort: 4 },
  { name: "Faisal Movers", url: "https://faisalmovers.com/", comfort: 4 },
  { name: "Skyways", url: "https://www.skyways.pk/", comfort: 3 },
  { name: "Niazi Express", url: "https://www.niaziexpress.com/", comfort: 3 },
];

export function intercityOptions(
  fromCity: string,
  toCity: string,
  date: string,
  travelers = 1
): IntercityOption[] {
  const from = findCity(fromCity);
  const to = findCity(toCity);
  if (!from || !to || from.city === to.city) return [];

  const km = roadKm(from.city, to.city);
  const hours = roadHours(km);
  const intl = !isPakistan(from.city) || !isPakistan(to.city);
  if (intl) return [];

  const out: IntercityOption[] = [];
  const seed = `${from.city}-${to.city}`;
  const jitter = (k: string) => 0.85 + hash01(seed + k) * 0.35;

  // --- train (only on mainline pairs)
  const railPair =
    (from.rail && to.rail && km > 150) ||
    (["Hunza", "Skardu", "Murree", "Gilgit"].includes(to.city) &&
      ["Karachi", "Lahore", "Islamabad", "Rawalpindi"].includes(from.city) &&
      false);

  if (from.rail && to.rail && km > 150) {
    const dep = 15 + Math.floor(hash01(seed + "tdep") * 6);
    const durH = km / 70 + 0.8;
    out.push({
      id: `ic_train_${from.city}_${to.city}`,
      mode: "train",
      operator: km > 900 ? "Pakistan Railways — business sleeper" : "Pakistan Railways — AC Business",
      from_city: from.city,
      to_city: to.city,
      depart_time: `${String(dep).padStart(2, "0")}:00`,
      arrive_time: `${String(Math.round((dep + durH) % 24)).padStart(2, "0")}:${hash01(seed + "tm") > 0.5 ? "30" : "00"}`,
      duration_min: Math.round(durH * 60),
      distance_km: km,
      price: Math.round((km * (km > 900 ? 5.2 : 4.4) * jitter("train")) / 50) * 50,
      currency: "PKR",
      comfort: km > 900 ? 4 : 3,
      notes:
        km > 900
          ? "Overnight business sleeper. Book 5–7 days ahead on busy weekends; bring your own food."
          : "AC Business class, book online or at the counter. Comfortable enough for a day run.",
      booking_url: railBookingUrl(from.city, to.city),
      booking_label: "Book on Pakistan Railways",
      is_live: false,
    });
  }

  // --- long-distance coach
  if (km > 80) {
    const op = BUS_OPERATORS[Math.floor(hash01(seed + "bus") * BUS_OPERATORS.length) % BUS_OPERATORS.length];
    const dep = 20 + Math.floor(hash01(seed + "bdep") * 4);
    const durH = km / 62 + 1;
    out.push({
      id: `ic_bus_${from.city}_${to.city}`,
      mode: "bus",
      operator: `${op.name} — luxury coach`,
      from_city: from.city,
      to_city: to.city,
      depart_time: `${String(dep % 24).padStart(2, "0")}:30`,
      arrive_time: `${String(Math.round((dep + durH) % 24)).padStart(2, "0")}:00`,
      duration_min: Math.round(durH * 60),
      distance_km: km,
      price: Math.round((km * 3.1 * jitter("bus")) / 50) * 50,
      currency: "PKR",
      comfort: op.comfort as 1 | 2 | 3 | 4 | 5,
      notes:
        km > 700
          ? "Long haul with two rest stops. Take the 3-seat luxury row, not the 4-seat economy."
          : "Frequent departures, reclining seats, one chai stop.",
      booking_url: op.url,
      booking_label: `Book on ${op.name.split(" ")[0]}`,
      is_live: false,
    });
  }

  // --- private car / jeep
  if (km < 500 || to.city === "Hunza" || to.city === "Skardu" || to.city === "Murree") {
    const isMountain = ["Hunza", "Skardu", "Murree", "Gilgit"].includes(to.city);
    const carHours = isMountain ? km / 38 + 1 : km / 62 + 0.5;
    const rate = isMountain ? 42 : 34;
    const price = Math.max(6500, Math.round((km * rate * jitter("car")) / 500) * 500);
    out.push({
      id: `ic_car_${from.city}_${to.city}`,
      mode: "car",
      operator: isMountain ? "Private 4x4 with driver (local operator)" : "Private sedan with driver",
      from_city: from.city,
      to_city: to.city,
      depart_time: "06:00",
      arrive_time: `${String(Math.round(6 + carHours) % 24).padStart(2, "0")}:${hash01(seed + "cm") > 0.5 ? "30" : "00"}`,
      duration_min: Math.round(carHours * 60),
      distance_km: km,
      price,
      currency: "PKR",
      comfort: isMountain ? 3 : 4,
      notes: isMountain
        ? "Full car (up to 4 pax). Split between travellers it usually beats flights — and stops for photos."
        : "Door-to-door for up to 4 people. Cheaper than flights for groups; no fixed timetable.",
      booking_url: `https://www.google.com/maps/dir/${encodeURIComponent(from.city)}/${encodeURIComponent(to.city)}`,
      booking_label: "Route & operators",
      is_live: false,
    });
  }

  // --- domestic flight on long hauls
  if (km > 700) {
    const fl = buildFlight(from, to, date, `ic-${seed}`, { travelers });
    out.push({
      id: fl.id,
      mode: "flight",
      operator: `${fl.airline} ${fl.flight_no}`,
      from_city: from.city,
      to_city: to.city,
      depart_time: fl.depart_time,
      arrive_time: fl.arrive_time,
      duration_min: fl.duration_min + 120, // airport time
      distance_km: km,
      price: Math.round((fl.price * jitter("fl")) / 500) * 500,
      currency: "PKR",
      comfort: 5,
      notes: "Add ~2h for airport. Northern flights cancel in bad weather — keep a road plan B.",
      booking_url: fl.booking_url,
      booking_label: "Compare & book",
      is_live: false,
    });
  }

  return out.sort((a, b) => a.price - b.price);
}

/* ------------------------------------------------------------------ */
/* Stays                                                              */
/* ------------------------------------------------------------------ */

const STAY_NAMES: Record<string, { name: string; area: string; type: StayOption["type"] }[]> = {
  Hunza: [
    { name: "Hunza Serena Inn", area: "Karimabad", type: "hotel" },
    { name: "Eagle's Nest Hotel", area: "Duikar", type: "hotel" },
    { name: "Rakaposhi View Guesthouse", area: "Nagore", type: "guesthouse" },
    { name: "Old Hunza Inn", area: "Karimabad", type: "guesthouse" },
    { name: "Hunza Baltit Inn", area: "Karimabad", type: "boutique" },
    { name: "Gojal Eco Lodge", area: "Gulmit", type: "guesthouse" },
  ],
  Skardu: [
    { name: "Shigar Fort Serena", area: "Shigar", type: "boutique" },
    { name: "Shangrila Resort", area: "Kachura", type: "resort" },
    { name: "Byarsa Hotel", area: "Skardu Town", type: "hotel" },
    { name: "Kharpocho Guest House", area: "Skardu Town", type: "guesthouse" },
    { name: "Cold Desert Camp", area: "Katpana", type: "hostel" },
  ],
  Lahore: [
    { name: "Nishat Hotel", area: "Gulberg III", type: "hotel" },
    { name: "Haveli Boutique", area: "Walled City", type: "boutique" },
    { name: "Luxus Grand", area: "Gulberg II", type: "hotel" },
    { name: "Faletti's Hotel", area: "Egerton Road", type: "boutique" },
    { name: "Gulberg Guest House", area: "Gulberg II", type: "guesthouse" },
  ],
  Karachi: [
    { name: "Mövenpick Karachi", area: "Clifton", type: "hotel" },
    { name: "Beach Luxury Hotel", area: "Saddar", type: "hotel" },
    { name: "Regent Plaza", area: "Shahrah-e-Faisal", type: "hotel" },
    { name: "Clifton Sea Breeze Guesthouse", area: "Clifton Block 2", type: "guesthouse" },
    { name: "The Nest Hostel", area: "Bahadurabad", type: "hostel" },
  ],
  Murree: [
    { name: "PC Bhurban", area: "Bhurban", type: "resort" },
    { name: "Cedar Hill Lodge", area: "Nathia Gali", type: "boutique" },
    { name: "Pine View Guesthouse", area: "Murree", type: "guesthouse" },
    { name: "Kashmir Point Cottages", area: "Mall Road", type: "apartment" },
  ],
  Islamabad: [
    { name: "Islamabad Serena", area: "Blue Area", type: "hotel" },
    { name: "F-6 Guest House", area: "F-6", type: "guesthouse" },
    { name: "Margalla View Apartments", area: "E-11", type: "apartment" },
    { name: "Envoy Continental", area: "Blue Area", type: "hotel" },
  ],
  Dubai: [
    { name: "Rove Downtown", area: "Downtown", type: "hotel" },
    { name: "Al Seef Heritage Hotel", area: "Al Seef", type: "boutique" },
    { name: "Satwa Budget Suites", area: "Satwa", type: "apartment" },
    { name: "Deira Creek Inn", area: "Deira", type: "hotel" },
  ],
  Bangkok: [
    { name: "Riva Surya Riverside", area: "Phra Athit", type: "boutique" },
    { name: "Silom Loft Hotel", area: "Silom", type: "hotel" },
    { name: "Khaosan Backpackers", area: "Khaosan", type: "hostel" },
    { name: "Sukhumvit Residence", area: "Sukhumvit", type: "apartment" },
  ],
  Istanbul: [
    { name: "Karaköy Rooms", area: "Karaköy", type: "boutique" },
    { name: "Sultanahmet Suites", area: "Sultanahmet", type: "hotel" },
    { name: "Balat Guesthouse", area: "Balat", type: "guesthouse" },
    { name: "Kadıköy Loft", area: "Kadıköy", type: "apartment" },
  ],
};

const STAY_IMG = [
  "/img/dest-hunza.jpg",
  "/img/dest-skardu.jpg",
  "/img/dest-murree.jpg",
  "/img/food-cafe.jpg",
  "/img/dest-lahore.jpg",
];

export function stayOptions(
  city: string,
  checkIn: string,
  checkOut: string,
  travelers: number,
  budgetPerNight: number
): StayOption[] {
  const list = STAY_NAMES[city] ?? [
    { name: `${city} Central Hotel`, area: "Centre", type: "hotel" as const },
    { name: `${city} Guesthouse`, area: "Old town", type: "guesthouse" as const },
  ];
  const dest = findDestination(city);
  const band = dest?.daily_band ?? 11000;
  const baseNight = Math.round(band * 0.55);

  return list.map((s, i) => {
    const mult = [1.9, 1.35, 0.78, 0.6, 2.4, 0.45][i % 6];
    const nightly = Math.max(3500, Math.round((baseNight * mult) / 500) * 500);
    const rating = Math.min(
      4.9,
      Math.max(3.8, 4.6 - i * 0.09 + hash01(s.name + city) * 0.35)
    );
    const perks =
      s.type === "hostel"
        ? ["Dorm bed", "Shared kitchen", "Free wifi"]
        : nightly > baseNight * 1.7
        ? ["Breakfast included", "Mountain view", "Airport pickup", "Heating"]
        : nightly > baseNight
        ? ["Breakfast included", "Free wifi", "Parking"]
        : ["Free wifi", "Hot water", "24h reception"];
    return {
      id: `st_${city}_${i}`,
      name: s.name,
      city,
      area: s.area,
      type: s.type,
      nightly_price: nightly,
      currency: "PKR",
      rating: Math.round(rating * 10) / 10,
      review_count: 60 + Math.floor(hash01(s.name + "rc") * 900),
      perks,
      image: STAY_IMG[i % STAY_IMG.length],
      map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        s.name + " " + city
      )}`,
      booking_url: bookingComUrl(city, checkIn, checkOut, travelers),
      booking_label: "Check price on Booking.com",
      is_live: false,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export class MockTravelProvider implements TravelProvider {
  name = "WanderMind Mock Data";
  isLive = false;

  async searchFlights(input: {
    fromCity: string;
    toCity: string;
    date: string;
    travelers: number;
    cabin?: string;
  }): Promise<FlightOption[]> {
    const from = findCity(input.fromCity);
    const to = findCity(input.toCity);
    if (!from || !to || from.city === to.city) return [];
    const km = roadKm(from.city, to.city);
    if (km < 220 && isPakistan(from.city) && isPakistan(to.city)) return [];
    const pool = isPakistan(from.city) && isPakistan(to.city)
      ? AIRLINES.filter((a) => a.domestic)
      : INTL_AIRLINES;
    return pool
      .slice(0, 5)
      .map((a) =>
        buildFlight(from, to, input.date, `${from.city}${to.city}${input.date}${a.code}`, {
          travelers: input.travelers,
          forceAirline: a,
          cabin: input.cabin,
        })
      )
      .sort((a, b) => a.price - b.price);
  }

  async searchFlightsRange(input: {
    fromCity: string;
    toCity: string;
    startDate: string;
    endDate: string;
    travelers: number;
  }): Promise<FlightOption[]> {
    const outbound = await this.searchFlights({
      fromCity: input.fromCity,
      toCity: input.toCity,
      date: input.startDate,
      travelers: input.travelers,
    });
    const inbound = await this.searchFlights({
      fromCity: input.toCity,
      toCity: input.fromCity,
      date: input.endDate,
      travelers: input.travelers,
    });
    return [...outbound, ...inbound];
  }

  async searchIntercity(input: {
    fromCity: string;
    toCity: string;
    date: string;
    travelers: number;
  }): Promise<IntercityOption[]> {
    return intercityOptions(input.fromCity, input.toCity, input.date, input.travelers);
  }

  async searchStays(input: {
    city: string;
    checkIn: string;
    checkOut: string;
    travelers: number;
    budgetPerNight: number;
  }): Promise<StayOption[]> {
    return stayOptions(
      input.city,
      input.checkIn,
      input.checkOut,
      input.travelers,
      input.budgetPerNight
    );
  }
}

export const mockProvider = new MockTravelProvider();
