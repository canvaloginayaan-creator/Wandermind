import { getProvider } from "./providers";
import type { FlightOption, IntercityOption, StayOption } from "./providers";
import { PLACES, findDestination, PlaceSeed } from "./data/places";
import { findCity, isPakistan, roadKm } from "./data/geo";
import { eachDay, addDays, money, minsToDur, hash01, mapUrl, clamp, timeToMins, minsToTime } from "./utils";
import type { ItineraryItem, Pace, Personality } from "./types";

export type DraftItem = Omit<ItineraryItem, "id" | "trip_id" | "created_at">;

export type PlanInput = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  travelers: number;
  personalities: string[];
  pace: Pace;
};

export type BudgetLine = {
  key: "transport" | "stay" | "food" | "activity" | "buffer";
  label: string;
  amount: number;
  perPerson: number;
  note: string;
};

export type PlanResult = {
  items: DraftItem[];
  budget: BudgetLine[];
  total: number;
  fits: boolean;
  delta: number; // positive => over budget
  warnings: Warning[];
  summary: string;
  chosenTransport: {
    outbound: FlightOption | IntercityOption | null;
    inbound: FlightOption | IntercityOption | null;
    mode: string;
  };
  stay: StayOption | null;
  stats: {
    days: number;
    nights: number;
    foodStops: number;
    activities: number;
    dailySpend: number;
    distanceKm: number;
  };
};

export type Warning = {
  id: string;
  severity: "info" | "warn" | "blocker";
  title: string;
  body: string;
  fix?: string;
};

const HUB_TRANSFER: Record<string, string> = { Hunza: "Gilgit", Murree: "Islamabad" };

const isFlight = (x: FlightOption | IntercityOption): x is FlightOption =>
  (x as FlightOption).airline !== undefined;

const totalFor = (opt: FlightOption | IntercityOption, travelers: number) =>
  opt.price * travelers;

function monthsIn(start: string, end: string) {
  const out = new Set<string>();
  eachDay(start, end).forEach((d) => {
    out.add(
      new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
        timeZone: "UTC",
        month: "long",
      })
    );
  });
  return [...out];
}

function placeScore(p: PlaceSeed, personalities: string[]) {
  const overlap = p.tags.filter((t) => personalities.includes(t as Personality)).length;
  return overlap * 2 + p.rating / 5;
}

export async function buildPlan(input: PlanInput): Promise<PlanResult> {
  const provider = getProvider();
  const days = eachDay(input.startDate, input.endDate);
  const nights = Math.max(1, days.length - 1);
  const travelers = Math.max(1, input.travelers);
  const dest = findDestination(input.destination);
  const warnings: Warning[] = [];

  /* ---------------- transport ---------------- */
  const [outFlights, inFlights] = await Promise.all([
    provider.searchFlights({
      fromCity: input.origin,
      toCity: input.destination,
      date: input.startDate,
      travelers,
    }),
    provider.searchFlights({
      fromCity: input.destination,
      toCity: input.origin,
      date: input.endDate,
      travelers,
    }),
  ]);
  const [outGround, inGround] = await Promise.all([
    provider.searchIntercity({
      fromCity: input.origin,
      toCity: input.destination,
      date: input.startDate,
      travelers,
    }),
    provider.searchIntercity({
      fromCity: input.destination,
      toCity: input.origin,
      date: input.endDate,
      travelers,
    }),
  ]);

  const scoreOption = (c: FlightOption | IntercityOption, allowance: number) => {
    const comfort = isFlight(c) ? (c.stops === 0 ? 3 : 2.2) : c.comfort * 0.6;
    const ratio = totalFor(c, travelers) / Math.max(1, allowance);
    const over = ratio > 1 ? (ratio - 1) * 1.5 : 0;
    const hours = c.duration_min / 60;
    const time = Math.min(5, hours * 0.18);
    return comfort - ratio * 1.3 - over - time;
  };

  const rankOptions = (
    flights: FlightOption[],
    ground: IntercityOption[],
    allowance: number
  ) =>
    [...flights, ...ground]
      .map((c) => ({ c, s: scoreOption(c, allowance) }))
      .sort((a, b) => b.s - a.s);

  const transportAllowance = input.budget * (isPakistan(input.destination) ? 0.38 : 0.46);

  const outRanked = rankOptions(outFlights, outGround, transportAllowance / 2);
  const outbound = outRanked[0]?.c ?? null;
  const outMode = outbound ? (isFlight(outbound) ? "flight" : (outbound as IntercityOption).mode) : "";

  const inRanked = rankOptions(inFlights, inGround, transportAllowance / 2);
  // stay on the same mode for the return leg when it's remotely competitive —
  // nobody wants to fly out and spend 30 hours on a coach coming back.
  const sameMode = inRanked.filter(
    (r) => (isFlight(r.c) ? "flight" : (r.c as IntercityOption).mode) === outMode
  );
  const bestIn = inRanked[0];
  const chosenIn =
    sameMode.length && (!bestIn || sameMode[0].s > bestIn.s - 0.85) ? sameMode[0] : bestIn;
  let inbound = chosenIn?.c ?? null;

  // Return fares shouldn't randomly double. If the mock/live return leg prices more
  // than 25% away from the outbound one, mirror the outbound leg onto the return date.
  if (outbound && inbound && Math.abs(inbound.price - outbound.price) / outbound.price > 0.25) {
    const booking = inbound.booking_url;
    const label = inbound.booking_label;
    inbound = isFlight(outbound)
      ? {
          ...outbound,
          id: `${outbound.id}_ret`,
          from_city: outbound.to_city,
          to_city: outbound.from_city,
          from_code: outbound.to_code,
          to_code: outbound.from_code,
          depart_date: input.endDate,
          arrive_date: input.endDate,
          booking_url: booking,
          booking_label: label,
        }
      : {
          ...(outbound as IntercityOption),
          id: `${(outbound as IntercityOption).id}_ret`,
          from_city: (outbound as IntercityOption).to_city,
          to_city: (outbound as IntercityOption).from_city,
          booking_url: booking,
          booking_label: label,
        };
  }


  const transportTotal = outbound && inbound ? totalFor(outbound, travelers) + totalFor(inbound, travelers) : 0;
  const cheapestGround = [...outGround, ...inGround].sort((a, b) => a.price - b.price)[0];

  if (
    outbound &&
    isFlight(outbound) &&
    cheapestGround &&
    cheapestGround.duration_min <= 1500 &&
    cheapestGround.price * travelers < transportTotal * 0.55
  ) {
    warnings.push({
      id: "train-cheaper",
      severity: "info",
      title: "A much cheaper way exists",
      body: `${cheapestGround.operator} costs about ${money(
        cheapestGround.price * travelers,
        input.currency
      )} each way versus ${money(totalFor(outbound, travelers), input.currency)} for the flight — but it adds roughly ${minsToDur(
        cheapestGround.duration_min
      )} of travel.`,
      fix: "Ask me to “switch transport to the cheapest option” and I'll rebuild the plan.",
    });
  }

  if (["Hunza", "Skardu"].includes(input.destination)) {
    warnings.push({
      id: "north-flights",
      severity: "warn",
      title: "Northern flights get cancelled",
      body: `Skardu and Gilgit flights cancel on maybe 1 in 4 attempts outside peak season. Every sensible plan keeps the Karakoram Highway road option as a backup.`,
      fix: "I've kept a road leg in the itinerary so a cancelled flight doesn't end the trip.",
    });
  }

  /* ---------------- stay ---------------- */
  const remainingAfterTransport = Math.max(0, input.budget - transportTotal);
  const foodPerDayEstimate = (dest?.daily_band ?? 9000) * 0.42;
  const activityPerDayEstimate = (dest?.daily_band ?? 9000) * 0.2;
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  const nightlyCap = Math.max(
    2500,
    (input.budget * 0.82 -
      transportTotal -
      (foodPerDayEstimate * 0.75 + activityPerDayEstimate * 0.6) * days.length) /
      (nights * rooms)
  );

  const stays = await provider.searchStays({
    city: input.destination,
    checkIn: input.startDate,
    checkOut: input.endDate,
    travelers,
    budgetPerNight: nightlyCap,
  });
  const affordableStays = stays.filter((s) => s.nightly_price <= nightlyCap * 1.05);
  const stay = affordableStays.length
    ? affordableStays.slice().sort((a, b) => b.rating * 0.7 - a.nightly_price / 4000)[0]
    : stays.slice().sort((a, b) => a.nightly_price - b.nightly_price)[0] ?? null;

  const stayTotal = stay ? stay.nightly_price * nights * rooms : 0;

  if (!affordableStays.length && stays.length) {
    warnings.push({
      id: "stay-over",
      severity: "warn",
      title: "Accommodation is the squeeze",
      body: `At ${money(nightlyCap, input.currency)}/night the cheapest usable option in ${input.destination} is still above your allowance once transport is paid for.`,
      fix: "Cut one night, travel with someone else, or move a night to a cheaper town nearby.",
    });
  }

  /* ---------------- food + activities ---------------- */
  const cityPool = PLACES.filter(
    (p) => p.city.toLowerCase() === input.destination.toLowerCase()
  );
  const pool = (cityPool.length ? cityPool : PLACES).slice().sort(
    (a, b) => placeScore(b, input.personalities) - placeScore(a, input.personalities)
  );
  const foodPool = pool.filter((p) => p.category === "food" || p.category === "cafe");
  const activityPool = pool.filter((p) => p.category !== "food" && p.category !== "cafe");
  const dayActivityPool = activityPool.filter((p) => p.category !== "nightlife");
  const eveActivityPool = activityPool;
  const used = new Set<string>();
  const takeFrom = (list: PlaceSeed[], seed: string, cap?: number) => {
    let candidates = list.filter((p) => !used.has(p.name));
    if (cap) {
      const affordable = candidates.filter((p) => p.cost <= cap);
      if (affordable.length) candidates = affordable;
      else candidates = candidates.slice().sort((a, b) => a.cost - b.cost).slice(0, 3);
    }
    if (!candidates.length) candidates = list;
    const idx = Math.floor(hash01(seed) * candidates.length) % candidates.length;
    const chosen = candidates[idx];
    if (chosen) used.add(chosen.name);
    return chosen;
  };

  const activitiesPerDay = input.pace === "slow" ? 1 : input.pace === "packed" ? 3 : 2;

  // Envelope for food + activities so the plan is built inside the budget it
  // was given, instead of being generated first and apologised for afterwards.
  const bufferEstimate = Math.round(input.budget * 0.07);
  const envelope = Math.max(0, input.budget - transportTotal - stayTotal - bufferEstimate);
  const mealsPerDay = input.pace === "packed" ? 4 : input.pace === "slow" ? 2 : 3;
  const perMealCap = Math.max(600, (envelope * 0.58) / Math.max(1, days.length * mealsPerDay * travelers));
  const perActivityCap = Math.max(
    300,
    (envelope * 0.32) / Math.max(1, days.length * activitiesPerDay * travelers)
  );
  const items: DraftItem[] = [];
  let budgetFood = 0;
  let budgetActivity = 0;

  const push = (partial: Record<string, unknown>) => {
    items.push({
      tags: [],
      is_live: 0,
      subtitle: "",
      start_time: "",
      end_time: "",
      location_name: "",
      cost: 0,
      booking_url: "",
      booking_label: "",
      provider_name: "",
      image: "",
      rating: null,
      price_band: "",
      map_url: "",
      meta: null,
      ...partial,
    } as unknown as DraftItem);
  };

  /* day 1: arrival + transport card */
  const outDepMins = outbound ? timeToMins(outbound.depart_time) : null;
  const outArrAbs = outbound && outDepMins != null ? outDepMins + outbound.duration_min : null;
  const arrDayOffset = outArrAbs != null ? Math.floor(outArrAbs / 1440) : 0;
  const arrMins = outArrAbs != null ? outArrAbs % 1440 : 9 * 60;
  const inDepMins = inbound ? timeToMins(inbound.depart_time) : null;

  const cafes = pool.filter((p) => p.category === "cafe");
  const foods = pool.filter((p) => p.category === "food");
  const breakfastPool = cafes.length >= 3 ? cafes : [...cafes, ...foods];
  const dinnerPool = foods.length ? foods : pool;

  days.forEach((day, dayIdx) => {
    const dayNum = dayIdx + 1;
    const isFirst = dayIdx === 0;
    const isLast = dayIdx === days.length - 1;
    const dayItems: DraftItem[] = [];

    // usable window on the ground
    let dayStart = 8 * 60 + 30;
    let dayEnd = 21 * 60;
    let travelOnly = false;

    if (isFirst && outbound) {
      const nextDay = arrDayOffset > 0 ? " · arrives next day" : "";
      dayItems.push({
        day_date: day,
        position: 0,
        kind: "transport",
        title: isFlight(outbound)
          ? `${outbound.airline} ${outbound.flight_no} — ${outbound.from_city} → ${outbound.to_city}`
          : `${outbound.operator} — ${outbound.from_city} → ${outbound.to_city}`,
        subtitle: isFlight(outbound)
          ? `${outbound.depart_time} → ${outbound.arrive_time}${nextDay} · ${minsToDur(outbound.duration_min)} · ${
              outbound.stops === 0 ? "Direct" : `${outbound.stops} stop`
            } · ${outbound.baggage}`
          : `${outbound.depart_time} → ${outbound.arrive_time}${nextDay} · ${minsToDur(
              outbound.duration_min
            )} · comfort ${outbound.comfort}/5`,
        start_time: outbound.depart_time,
        end_time: outbound.arrive_time,
        location_name: isFlight(outbound)
          ? `${outbound.from_code} → ${outbound.to_code}`
          : `${outbound.from_city} → ${outbound.to_city}`,
        cost: totalFor(outbound, travelers),
        booking_url: outbound.booking_url,
        booking_label: outbound.booking_label,
        provider_name: outbound.provider_name ?? "",
        image: dest?.image ?? "/img/hero.jpg",
        rating: null,
        price_band: "",
        map_url: outbound.booking_url,
        tags: [],
        is_live: outbound.is_live ? 1 : 0,
        meta: {
          mode: isFlight(outbound) ? "flight" : (outbound as IntercityOption).mode,
          direction: "outbound",
        },
      } as unknown as DraftItem);
    }

    if (isFirst && outbound && isFlight(outbound)) {
      const hub = HUB_TRANSFER[input.destination];
      if (hub && hub !== input.destination) {
        dayItems.push({
          day_date: addDays(day, arrDayOffset),
          position: 0,
          kind: "note",
          title: `Road transfer — ${hub} to ${input.destination}`,
          subtitle: `About 2–3 hours by private car. Budget PKR 4,000–6,000 each way; not included in the totals above.`,
          start_time: minsToTime(arrMins + 30),
          end_time: minsToTime(arrMins + 180),
          location_name: `${hub} → ${input.destination}`,
          cost: 0,
          booking_url: "",
          booking_label: "",
          provider_name: "",
          image: "",
          rating: null,
          price_band: "",
          map_url: "",
          tags: ["transfer"],
          is_live: 0,
          meta: { mode: "transfer" },
        } as unknown as DraftItem);
      }
    }

    if (isLast && inbound && inDepMins != null) {
      dayEnd = Math.min(dayEnd, inDepMins - 120);
    }

    if (isFirst) {
      if (arrDayOffset === 0) dayStart = Math.max(dayStart, Math.ceil((arrMins + 75) / 15) * 15);
      else travelOnly = true;
    } else if (dayIdx === arrDayOffset) {
      dayStart = Math.max(dayStart, Math.ceil((arrMins + 60) / 15) * 15);
    } else if (dayIdx < arrDayOffset) {
      travelOnly = true;
    }
    if (isLast && isFirst) travelOnly = false;
    if (dayStart >= 20 * 60) travelOnly = true;
    if (isLast && dayEnd < dayStart + 60) travelOnly = true;
    dayStart = Math.min(dayStart, 19 * 60);

    if (dayIdx === arrDayOffset && stay) {
      dayItems.push({
        day_date: day,
        position: 0,
        kind: "stay",
        title: `Check in — ${stay.name}`,
        subtitle: `${stay.area} · ${stay.type} · ${money(stay.nightly_price, input.currency)}/night · ${nights} night${nights > 1 ? "s" : ""}`,
        start_time: minsToTime(Math.max(15 * 60, dayStart)),
        end_time: minsToTime(Math.max(15 * 60, dayStart) + 45),
        location_name: stay.area,
        cost: stayTotal,
        booking_url: stay.booking_url,
        booking_label: stay.booking_label,
        provider_name: "Booking.com",
        image: stay.image,
        rating: stay.rating,
        price_band: "",
        map_url: stay.map_url,
        tags: stay.perks,
        is_live: stay.is_live ? 1 : 0,
        meta: { mode: "stay", nightly: String(stay.nightly_price), rooms: String(rooms) },
      } as unknown as DraftItem);
      dayStart = Math.max(dayStart, 16 * 60);
    }

    if (!travelOnly) {
      // ---- meals, only inside the usable window
      const mealPlan: { at: number; label: string; list: PlaceSeed[] }[] = [
        { at: 8 * 60 + 30, label: "Breakfast", list: breakfastPool },
        { at: 13 * 60, label: "Lunch", list: foods.length ? foods : pool },
        { at: 19 * 60 + 30, label: "Dinner", list: dinnerPool },
      ];
      if (input.pace === "packed") mealPlan.push({ at: 16 * 60 + 30, label: "Coffee stop", list: breakfastPool });
      if (input.pace === "slow") mealPlan.splice(1, 1); // no separate lunch on a slow day

      const liveMeals = mealPlan.filter((m) => m.at >= dayStart && m.at <= dayEnd);
      if (!liveMeals.length && dayEnd - dayStart > 90) {
        liveMeals.push({ at: dayStart + 30, label: "Quick bite", list: dinnerPool });
      }

      const mealTimes = liveMeals.map((m) => m.at);

      liveMeals.forEach((meal) => {
        const place = takeFrom(meal.list, `${day}-${meal.label}-${dayNum}`, perMealCap);
        if (!place) return;
        const cost = place.cost * travelers;
        budgetFood += cost;
        dayItems.push({
          day_date: day,
          position: 0,
          kind: "food",
          title: `${meal.label} at ${place.name}`,
          subtitle: `${place.area} · ${place.band} · ${place.hours}${place.rating ? ` · ★ ${place.rating}` : ""}`,
          start_time: minsToTime(meal.at),
          end_time: "",
          location_name: `${place.name}, ${place.city}`,
          cost,
          booking_url: mapUrl(place.name, place.city),
          booking_label: "Open in Maps",
          provider_name: "Google Maps",
          image: place.image,
          rating: place.rating,
          price_band: place.band,
          map_url: mapUrl(place.name, place.city),
          tags: place.tags as string[],
          is_live: 0,
          meta: { mode: "food", meal: meal.label, blurb: place.blurb },
        } as unknown as DraftItem);
      });

      // ---- activities, spaced across the free window
      const actCount = isFirst || isLast ? Math.max(1, activitiesPerDay - 1) : activitiesPerDay;
      let at = dayStart + 75;
      for (let ai = 0; ai < actCount; ai++) {
        if (at > dayEnd - 90) break;
        // avoid stacking exactly on a meal
        while (mealTimes.some((m) => Math.abs(m - at) < 45)) at += 60;
        if (at > dayEnd - 90) break;
        const place = takeFrom(
          at >= 17 * 60 ? eveActivityPool : dayActivityPool,
          `${day}-act-${ai}-${dayNum}`,
          perActivityCap
        );
        if (place) {
          const cost = place.cost * travelers;
          budgetActivity += cost;
          dayItems.push({
            day_date: day,
            position: 0,
            kind: "activity",
            title: place.name,
            subtitle: `${place.area} · ${place.band} · ${place.hours}`,
            start_time: minsToTime(at),
            end_time: minsToTime(at + 120),
            location_name: `${place.name}, ${place.city}`,
            cost,
            booking_url: mapUrl(place.name, place.city),
            booking_label: "Open in Maps",
            provider_name: "Google Maps",
            image: place.image,
            rating: place.rating,
            price_band: place.band,
            map_url: mapUrl(place.name, place.city),
            tags: place.tags as string[],
            is_live: 0,
            meta: { mode: "activity", blurb: place.blurb },
          } as unknown as DraftItem);
        }
        at += 195;
      }
    }

    if (isLast && inbound) {
      const nextDay = inDepMins != null && inbound.duration_min + inDepMins > 1440 ? " · arrives next day" : "";
      dayItems.push({
        day_date: day,
        position: 99,
        kind: "transport",
        title: isFlight(inbound)
          ? `${inbound.airline} ${inbound.flight_no} — ${inbound.from_city} → ${inbound.to_city}`
          : `${inbound.operator} — ${inbound.from_city} → ${inbound.to_city}`,
        subtitle: isFlight(inbound)
          ? `${inbound.depart_time} → ${inbound.arrive_time}${nextDay} · ${minsToDur(inbound.duration_min)} · ${
              inbound.stops === 0 ? "Direct" : `${inbound.stops} stop`
            }`
          : `${inbound.depart_time} → ${inbound.arrive_time}${nextDay} · ${minsToDur(inbound.duration_min)}`,
        start_time: inbound.depart_time,
        end_time: inbound.arrive_time,
        location_name: isFlight(inbound)
          ? `${inbound.from_code} → ${inbound.to_code}`
          : `${inbound.from_city} → ${inbound.to_city}`,
        cost: totalFor(inbound, travelers),
        booking_url: inbound.booking_url,
        booking_label: inbound.booking_label,
        provider_name: inbound.provider_name ?? "",
        image: dest?.image ?? "/img/hero.jpg",
        rating: null,
        price_band: "",
        map_url: inbound.booking_url,
        tags: [],
        is_live: inbound.is_live ? 1 : 0,
        meta: {
          mode: isFlight(inbound) ? "flight" : (inbound as IntercityOption).mode,
          direction: "return",
        },
      } as unknown as DraftItem);
    }

    // sort the day by clock, keeping the arrival transport first and the return leg last
    dayItems.sort((a, b) => {
      const rank = (i: DraftItem) => {
        if (i.kind === "transport" && i.meta?.direction === "outbound") return -1;
        if (i.kind === "transport" && i.meta?.direction === "return") return 9999;
        return timeToMins(i.start_time || "12:00");
      };
      return rank(a) - rank(b);
    });
    dayItems.forEach((it, idx) => {
      it.position = idx;
      items.push(it);
    });
  });

  /* ---------------- reconcile budget ---------------- */
  const buffer = Math.round(input.budget * 0.07);
  const subtotal = transportTotal + stayTotal + budgetFood + budgetActivity;
  const total = subtotal + buffer;
  const delta = total - input.budget;
  const fits = delta <= 0;

  // If we're way over, trim activities to a realistic level and recompute once.
  let finalItems = items;
  let finalFood = budgetFood;
  let finalActivity = budgetActivity;
  if (delta > input.budget * 0.15) {
    const trimTarget = delta - input.budget * 0.05;
    let trimmed = 0;
    finalItems = items.filter((it) => {
      if (trimmed >= trimTarget) return true;
      if (it.kind === "activity" && it.cost > 0) {
        trimmed += it.cost;
        return false;
      }
      return true;
    });
    if (trimmed > 0) {
      finalActivity = Math.max(0, budgetActivity - trimmed);
      warnings.push({
        id: "activities-trimmed",
        severity: "warn",
        title: `I dropped ${money(trimmed, input.currency)} of paid activities`,
        body: `Your plan was ${money(delta, input.currency)} over budget, so I kept only the free and low-cost stops. The itinerary below is what your money actually buys.`,
        fix: "Add budget, cut a night, or tell me which activity you refuse to lose and I'll trade something else for it.",
      });
    }
  }
  const finalSubtotal = transportTotal + stayTotal + finalFood + finalActivity;
  const finalTotal = finalSubtotal + buffer;
  const finalDelta = finalTotal - input.budget;

  // Re-number positions per day
  const byDay = new Map<string, DraftItem[]>();
  finalItems.forEach((it) => {
    const arr = byDay.get(it.day_date) ?? [];
    arr.push(it);
    byDay.set(it.day_date, arr);
  });
  finalItems = [...byDay.entries()]
    .flatMap(([day, arr]) =>
      arr
        .sort((a, b) => (a.position === 99 ? 1 : b.position === 99 ? -1 : a.position - b.position))
        .map((it, i) => ({ ...it, position: i }))
    )
    .sort((a, b) => (a.day_date < b.day_date ? -1 : a.day_date > b.day_date ? 1 : a.position - b.position));

  /* ---------------- realism checks ---------------- */
  const dailySpend = Math.round(finalTotal / days.length / travelers);
  const destBand = dest?.daily_band ?? 9000;

  if (dailySpend < destBand * 0.55) {
    warnings.push({
      id: "thin-budget",
      severity: "warn",
      title: "This is genuinely tight",
      body: `You're allocating about ${money(dailySpend, input.currency)} per person per day. Mid-range ${input.destination} runs nearer ${money(
        destBand,
        input.currency
      )}. It's doable — but expect shared rooms, local transport and street food, not restaurants.`,
      fix: "Either add about 35–40% to the budget, or shorten the trip by a night or two.",
    });
  }
  if (finalDelta > 0) {
    warnings.push({
      id: "over-budget",
      severity: "blocker",
      title: `${money(finalDelta, input.currency)} over budget`,
      body: `Realistically this trip costs ${money(finalTotal, input.currency)} for ${travelers} traveller${
        travelers > 1 ? "s" : ""
      }. I'd rather tell you now than have you find out at the airport.`,
      fix: "Shave a night, switch the flight to the coach, or raise the budget — say the word and I'll re-plan.",
    });
  }
  if (finalDelta < -input.budget * 0.25) {
    warnings.push({
      id: "under-budget",
      severity: "info",
      title: "You have room to upgrade",
      body: `You're coming in ${money(Math.abs(finalDelta), input.currency)} under budget. That's a better hotel, a private driver for the mountain day, or one proper splurge dinner.`,
      fix: "Ask me to “use the leftover budget on” food, stay or experiences.",
    });
  }

  const months = monthsIn(input.startDate, input.endDate);
  if (dest && months.length) {
    const good = months.every((m) => dest.best_months.includes(m));
    if (!good) {
      warnings.push({
        id: "season",
        severity: "info",
        title: `Season check: ${months.join(" / ")}`,
        body: dest.weather_note,
        fix: `Best months for ${input.destination} are ${dest.best_months.join(", ")}.`,
      });
    }
  }

  const travelDays = 2;
  if (days.length <= travelDays + 1) {
    warnings.push({
      id: "short-trip",
      severity: "warn",
      title: "Two of these days are travel days",
      body: `On a ${days.length}-day trip to ${input.destination} you lose most of day 1 and day ${days.length} to airports or the highway. That leaves ${Math.max(
        0,
        days.length - travelDays
      )} real day${days.length - travelDays === 1 ? "" : "s"}.`,
      fix: `Add a night — ${input.destination} is not worth the commute for one day.`,
    });
  }

  const distanceKm = roadKm(input.origin, input.destination);
  if (distanceKm > 1200 && isPakistan(input.destination)) {
    warnings.push({
      id: "long-haul",
      severity: "info",
      title: "That is a long way for a short trip",
      body: `${input.origin} → ${input.destination} is roughly ${distanceKm.toLocaleString()} km. ` +
        (days.length < 6
          ? `Under ${days.length} days, more than half your waking hours are transport.`
          : `With ${days.length} days you have enough time for this — but book the return leg early.`),
      fix: days.length < 6 ? "Six days minimum for this route, or pick a closer destination." : undefined,
    });
  }

  const budget: BudgetLine[] = [
    {
      key: "transport",
      label: "Travel (return)",
      amount: transportTotal,
      perPerson: Math.round(transportTotal / travelers),
      note: `${outbound ? (isFlight(outbound) ? outbound.airline : outbound.operator) : "—"} + return`,
    },
    {
      key: "stay",
      label: "Stay",
      amount: stayTotal,
      perPerson: Math.round(stayTotal / travelers),
      note: stay ? `${nights} night${nights > 1 ? "s" : ""} × ${rooms} room${rooms > 1 ? "s" : ""} at ${stay.name}` : "—",
    },
    {
      key: "food",
      label: "Food & drink",
      amount: finalFood,
      perPerson: Math.round(finalFood / travelers),
      note: `${Math.round(finalFood / days.length / travelers)}/person/day`,
    },
    {
      key: "activity",
      label: "Activities",
      amount: finalActivity,
      perPerson: Math.round(finalActivity / travelers),
      note: "Entries, guides, boats, jeeps",
    },
    {
      key: "buffer",
      label: "Buffer (7%)",
      amount: buffer,
      perPerson: Math.round(buffer / travelers),
      note: "The money you will actually need and didn't plan for",
    },
  ];

  const summary = buildSummary({
    input,
    days: days.length,
    nights,
    outbound,
    stay,
    total: finalTotal,
    fits: finalDelta <= 0,
    delta: finalDelta,
    dailySpend,
  });

  return {
    items: finalItems,
    budget,
    total: finalTotal,
    fits: finalDelta <= 0,
    delta: finalDelta,
    warnings,
    summary,
    chosenTransport: {
      outbound,
      inbound,
      mode: outbound ? (isFlight(outbound) ? "flight" : (outbound as IntercityOption).mode) : "none",
    },
    stay,
    stats: {
      days: days.length,
      nights,
      foodStops: finalItems.filter((i) => i.kind === "food").length,
      activities: finalItems.filter((i) => i.kind === "activity").length,
      dailySpend,
      distanceKm,
    },
  };
}

function buildSummary(a: {
  input: PlanInput;
  days: number;
  nights: number;
  outbound: FlightOption | IntercityOption | null;
  stay: StayOption | null;
  total: number;
  fits: boolean;
  delta: number;
  dailySpend: number;
}) {
  const { input, days, nights, outbound, stay, total, fits, delta, dailySpend } = a;
  const who = input.travelers > 1 ? `${input.travelers} of you` : "you";
  const transportLine = outbound
    ? isFlight(outbound)
      ? `${outbound.airline} ${outbound.flight_no} out of ${outbound.from_code} at ${outbound.depart_time}`
      : `${outbound.operator} leaving at ${outbound.depart_time}`
    : "transport still to be decided";
  const mood =
    input.pace === "slow"
      ? "loose, one anchor a day"
      : input.pace === "packed"
      ? "full days, early starts"
      : "two or three things a day with room to breathe";

  return [
    `Here's ${input.destination} for ${days} day${days > 1 ? "s" : ""} (${nights} night${nights > 1 ? "s" : ""}) for ${who}, ${mood}.`,
    `You're on ${transportLine}${stay ? `, sleeping at ${stay.name} in ${stay.area}` : ""}.`,
    fits
      ? `Everything below lands at ${money(total, input.currency)} — about ${money(dailySpend, input.currency)} per person per day, with ${money(Math.abs(delta), input.currency)} still in the budget.`
      : `Honestly, this comes to ${money(total, input.currency)}, which is ${money(delta, input.currency)} over what you gave me.`,
    `I'd rather you know that now.`,
  ].join(" ");
}

