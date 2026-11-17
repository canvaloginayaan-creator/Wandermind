import { llmComplete } from "./llm";
import { liveConfig } from "./providers/live";
import { money, minsToDur, fmtDate } from "./utils";
import type { ItineraryItem, Trip } from "./types";
import { personalityLabel } from "./types";
import { findDestination } from "./data/places";

export type AssistantContext = {
  trip: Trip;
  items: ItineraryItem[];
  plannedSpend: number;
  loggedSpend: number;
  days: number;
};

export type AssistantReply = {
  content: string;
  suggestions: string[];
  source: "live-llm" | "reasoning";
};

const count = (ctx: AssistantContext, kind: string) =>
  ctx.items.filter((i) => i.kind === kind).length;

function facts(ctx: AssistantContext) {
  const t = ctx.trip;
  const dest = findDestination(t.destination);
  const transport = ctx.items.filter((i) => i.kind === "transport");
  const stay = ctx.items.find((i) => i.kind === "stay");
  const food = ctx.items.filter((i) => i.kind === "food");
  const acts = ctx.items.filter((i) => i.kind === "activity");
  const perDay = Math.round(ctx.plannedSpend / Math.max(1, ctx.days) / Math.max(1, t.travelers));
  const remaining = t.budget_total - ctx.plannedSpend;
  return [
    `Trip: ${t.title} — ${t.origin} to ${t.destination}, ${t.country}`,
    `Dates: ${t.start_date} → ${t.end_date} (${ctx.days} days)`,
    `Travellers: ${t.travelers}. Currency: ${t.currency}. Budget: ${money(t.budget_total, t.currency)}. Planned: ${money(ctx.plannedSpend, t.currency)}. Logged actuals: ${money(ctx.loggedSpend, t.currency)}.`,
    `Headroom: ${money(remaining, t.currency)}. Per person per day: ${money(perDay, t.currency)}.`,
    `Traveller type: ${t.personalities.map(personalityLabel).join(", ") || "unspecified"}. Pace: ${t.pace}.`,
    transport.length
      ? `Transport: ${transport
          .map((i) => `${i.title} at ${i.start_time} for ${money(i.cost, t.currency)}`)
          .join("; ")}`
      : "Transport: not booked yet.",
    stay ? `Stay: ${stay.title} — ${money(stay.cost, t.currency)} total.` : "Stay: not chosen.",
    `Food stops: ${food.length} (${food
      .slice(0, 5)
      .map((f) => f.title)
      .join("; ")}).`,
    `Activities: ${acts.length} — ${acts
      .slice(0, 6)
      .map((a) => a.title)
      .join("; ")}.`,
    dest ? `Destination facts: ${dest.weather_note} Best months: ${dest.best_months.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM = `You are WanderMind's trip assistant: a well-travelled, blunt-but-kind friend who has actually been to these places.
Rules:
- Answer with concrete numbers from the CONTEXT. Never invent prices, restaurants, or booking links.
- Be honest. If the budget is unrealistic, say so plainly, then offer 2-3 specific trade-offs.
- 90-180 words. Short paragraphs. No bullet-point walls, no headings, no markdown tables.
- Never say "as an AI". Never pad with disclaimers.
- End with one pointed question that helps you improve the plan.`;

/* ------------------------------------------------------------------ */

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w));

export async function assistantReply(
  ctx: AssistantContext,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<AssistantReply> {
  const cfg = liveConfig();
  if (cfg.llm) {
    const live = await llmComplete([
      { role: "system", content: SYSTEM },
      { role: "system", content: `CONTEXT\n${facts(ctx)}` },
      ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ]);
    if (live) {
      return { content: live, suggestions: suggestionsFor(ctx, userMessage), source: "live-llm" };
    }
  }
  return {
    content: reason(ctx, userMessage),
    suggestions: suggestionsFor(ctx, userMessage),
    source: "reasoning",
  };
}

function reason(ctx: AssistantContext, raw: string): string {
  const q = raw.toLowerCase();
  const t = ctx.trip;
  const cur = t.currency;
  const perDay = Math.round(ctx.plannedSpend / Math.max(1, ctx.days) / Math.max(1, t.travelers));
  const remaining = t.budget_total - ctx.plannedSpend;
  const transport = ctx.items.filter((i) => i.kind === "transport");
  const outbound = transport[0];
  const stay = ctx.items.find((i) => i.kind === "stay");
  const dest = findDestination(t.destination);
  const foods = ctx.items.filter((i) => i.kind === "food");
  const acts = ctx.items.filter((i) => i.kind === "activity");

  if (has(q, "cheap", "reduce", "cut", "save", "expensive", "afford", "too much", "lower")) {
    const cheapestAct = acts.slice().sort((a, b) => a.cost - b.cost)[0];
    const priciestMeal = foods.slice().sort((a, b) => b.cost - a.cost)[0];
    return [
      `Right now you're at ${money(perDay, cur)} per person per day, which is ${remaining >= 0 ? `${money(remaining, cur)} inside` : `${money(-remaining, cur)} over`} your ${money(t.budget_total, cur)} budget.`,
      `${stay ? `The stay is your biggest lever — ${money(stay.cost, cur)} across ${ctx.days - 1} nights. Dropping one category of hotel and moving two streets back usually saves 25–30%.` : ""} ${outbound ? `After that, transport: ${money(outbound.cost, cur)} for the outbound leg.` : ""}`,
      priciestMeal ? `Food is easy to fix without hurting the trip: ${priciestMeal.title} is ${money(priciestMeal.cost, cur)}. Swap it for a street-food dinner and you keep the experience, lose the bill.` : "",
      `Want me to re-plan with a hard cap? Tell me the number and I'll rebuild the days around it${cheapestAct ? ` — starting by keeping ${cheapestAct.title}, which is basically free` : ""}.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (has(q, "upgrade", "leftover", "splurge", "left over", "extra", "more money")) {
    return [
      `You've got ${money(Math.max(0, remaining), cur)} unallocated. My order of spending it:`,
      `First, the stay — one tier up in ${t.destination} buys you reliable hot water and a view, which matters more than it sounds.${stay ? ` You're currently at ${money(stay.cost, cur)} total.` : ""}`,
      `Second, a private driver for the one day that involves mountain roads. Shared transport on those stretches is the single most common way a good trip turns exhausting.`,
      `Third — and only third — one proper dinner. Pick the highest-rated place on your food list and let it be the memory.`,
      `Which of those three appeals most? I'll rebalance the rest to pay for it.`,
    ].join("\n\n");
  }

  if (has(q, "realistic", "honest", "is this ok", "does this work", "sanity", "truth")) {
    const tight = perDay < (dest?.daily_band ?? 9000) * 0.7;
    return [
      tight
        ? `Honest answer: it's tight. ${money(perDay, cur)} a day in ${t.destination} is backpacker territory — shared rooms, local buses, and eating where the drivers eat. That can be a great trip, but it is not the same trip as the one in the pretty photos.`
        : `Honest answer: yes, it works. ${money(perDay, cur)} per person per day in ${t.destination} sits in the comfortable mid-range — decent room, one paid activity a day, and you don't have to think about every cup of tea.`,
      ctx.days <= 4
        ? `The bigger problem isn't money, it's time. ${ctx.days} days with a return leg means one full day on the ground. You'll spend more time in transit than in ${t.destination}.`
        : `Your pacing across ${ctx.days} days is fine — ${acts.length} activities total means about ${Math.round(acts.length / ctx.days)} a day, which is sustainable.`,
      `The thing I'd push back on: ${outbound ? `${outbound.title} leaves at ${outbound.start_time}` : "the transport isn't locked in"}. Everything after that depends on it, so book it before the hotel.`,
      `Want the honest version of a "no"? Tell me your hard ceiling and I'll show you what it actually buys.`,
    ].join("\n\n");
  }

  if (has(q, "train", "transport", "flight", "bus", "how do i get", "travel to", "drive")) {
    return [
      `For ${t.origin} → ${t.destination} the plan currently uses ${outbound ? outbound.title : "nothing yet"}.`,
      outbound
        ? `${outbound.subtitle}. Cost is ${money(outbound.cost, cur)} for the party. ${outbound.provider_name ? `Booking goes through ${outbound.provider_name}.` : ""}`
        : "",
      dest && ["Hunza", "Skardu"].includes(dest.city)
        ? `For the north, remember the flights are the unreliable part, not the road. If the weather window closes you're on the Karakoram Highway for 12+ hours, so budget a night in Islamabad on either side and don't cut it fine.`
        : `If your dates are flexible by a day or two, shifting them usually beats hunting for a discount on the exact date.`,
      `Do you want me to swap this for the cheapest option, or the most comfortable one that still fits?`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (has(q, "eat", "food", "restaurant", "dinner", "breakfast", "lunch", "street")) {
    const top = foods.slice(0, 3);
    return [
      `You've got ${foods.length} food stops locked in. ${top.length ? `The ones I'd actually defend: ${top.map((f) => f.title.replace(/^(Breakfast|Lunch|Dinner|Coffee stop) at /, "")).join(", ")}.` : ""}`,
      t.destination === "Hunza"
        ? `In Hunza, eat the apricot and walnut baking — every café does it and the best one isn't the famous one. Skip anything flown in; the valley's own food is better.`
        : t.destination === "Lahore"
        ? `In Lahore, breakfast is the meal people underestimate. Siri paye at 8am will ruin every hotel breakfast for you afterwards.`
        : t.destination === "Karachi"
        ? `Karachi rewards evenings. Burns Road after 8pm is the whole point of the city; go hungry, carry cash, and start at the busiest stall.`
        : `Book one dinner properly and let the rest be improvisation — that ratio usually produces the better trip.`,
      `Each card has a map link and current opening hours. If a place looks packed, the rule is: if there's no queue, ask why.`,
      `Any dietary limits I should plan around?`,
    ].join("\n\n");
  }

  if (has(q, "weather", "season", "rain", "month", "cold", "hot", "snow")) {
    return [
      dest
        ? `For ${t.destination}: ${dest.weather_note}`
        : `I don't have live weather for ${t.destination} wired in — but the season matters more than the forecast.`,
      `Your dates are ${fmtDate(t.start_date)} to ${fmtDate(t.end_date)}. ${dest ? `Best months there are ${dest.best_months.join(", ")}.` : ""}`,
      `Build one indoor or flexible day per three outdoor days. That's not pessimism, it's how trips survive a washout.`,
      `Want me to add a weather-contingency day to the itinerary?`,
    ].join("\n\n");
  }

  if (has(q, "safe", "kids", "child", "family", "women", "solo", "health", "altitude")) {
    return [
      `Practical points for ${t.destination} rather than generic advice:`,
      ["Hunza", "Skardu"].includes(t.destination)
        ? `Altitude is the real risk, not crime. ${t.destination === "Skardu" ? "Deosai sits above 4,000m — do not drive up and walk hard on day one." : "Karimabad is 2,400m; sleep a night in Islamabad before flying and drink more water than you think."} Travel insurance that covers trekking and evacuation is not optional up here.`
        : `The usual city sense applies: no flashy jewellery at night, use ride-hailing after dark, and keep one card and some cash separate from the rest.`,
      `Medical: carry ORS, a personal antibiotic, and your regular medication in original packaging. In the north, pharmacies are basic — bring what you need from ${t.origin}.`,
      `With kids, halve the daily plan. Everything takes twice as long and the meltdowns are usually about food timing, not the sights.`,
      `Is this a family trip or an adults-only one? That changes which days I'd restructure.`,
    ].join("\n\n");
  }

  if (has(q, "pack", "bring", "luggage", "suitcase")) {
    return [
      `For ${t.destination} in this window: layers, not bulk. Mountain valleys swing 15°C between morning and afternoon.`,
      `Non-negotiables: a light waterproof shell, broken-in shoes, a power bank (load-shedding is normal), cash in small notes, and a refillable bottle.`,
      `Leave behind: anything you'd be upset to lose, and half the clothes you've laid out. You will rewear things and nobody will notice.`,
      `Anything specific — trekking? formal dinner? camera gear? — tell me and I'll tighten the list.`,
    ].join("\n\n");
  }

  if (has(q, "book", "reserve", "ticket", "payment")) {
    return [
      `I don't take payments — deliberately. Every transport, stay and restaurant card in this trip has a link straight to the operator's own booking page, so you're never paying a middle layer.`,
      outbound ? `Start with the transport (${outbound.title}) — it's the piece with the least flexibility on price and dates.` : `Start with transport; everything else can shift around it.`,
      stay ? `Then ${stay.title.replace("Check in — ", "")}: book a refundable rate now, re-shop it two weeks out.` : "",
      `Restaurants: only the ones that genuinely need a booking. Ask me which, and I'll flag the risky ones.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (has(q, "day 2", "day 3", "day 4", "day 5", "day 1")) {
    const dayNum = Number((/(\d)/.exec(q) ?? ["", "1"])[1]);
    const dates = [...new Set(ctx.items.map((i) => i.day_date))].sort();
    const target = dates[Math.min(dates.length - 1, dayNum - 1)];
    const dayItems = ctx.items.filter((i) => i.day_date === target);
    return [
      `Day ${dayNum} (${target ? fmtDate(target) : "—"}) currently: ${dayItems.map((i) => i.title).join(" → ") || "empty"}.`,
      dayItems.length > 4
        ? `That's a lot. Realistically you'll do three of them well and rush the rest. I'd drop the one furthest from the others.`
        : `That's a comfortable pace — you'll actually finish it.`,
      `Want me to make it cheaper, or swap the museum-type stop for something outdoors?`,
    ].join("\n\n");
  }

  if (has(q, "hi", "hello", "hey", "start") || q.trim().length < 4) {
    return [
      `I've read your ${t.destination} plan — ${ctx.days} days, ${t.travelers} traveller${t.travelers > 1 ? "s" : ""}, ${money(t.budget_total, cur)} total.`,
      `Two things I'd flag straight away. ${outbound ? `Your outbound is ${outbound.title} at ${outbound.start_time}.` : `You have no transport booked yet.`} ${perDay < (dest?.daily_band ?? 9000) * 0.7 ? `And your daily envelope of ${money(perDay, cur)} is lower than a comfortable ${t.destination} — doable, but you'll be choosing between dinner and the museum.` : `Your daily envelope of ${money(perDay, cur)} is comfortable for ${t.destination}.`}`,
      `Ask me to make it cheaper, more comfortable, or more honest. I can also rebuild a specific day.`,
    ].join("\n\n");
  }

  return [
    `That's a good question and I want to answer it with your numbers rather than a brochure.`,
    `Where you stand: ${ctx.days} days in ${t.destination}, ${money(ctx.plannedSpend, cur)} planned against a ${money(t.budget_total, cur)} budget — ${money(perDay, cur)} per person per day, ${remaining >= 0 ? `${money(remaining, cur)} of headroom left` : `${money(-remaining, cur)} over`}.`,
    `${acts.length} activities, ${foods.length} food stops, ${stay ? `staying at ${stay.title.replace("Check in — ", "")}` : "no stay chosen yet"}.`,
    `If you want something specific — cheaper, slower, more food, fewer museums, better hotels — say the word and I'll re-plan around it.`,
  ].join("\n\n");
}

function suggestionsFor(ctx: AssistantContext, q: string): string[] {
  const cur = ctx.trip.currency;
  const base = [
    "Is this budget realistic?",
    "Make it cheaper by 20%",
    `What should I do on day 2?`,
    "Which parts must I book first?",
    "Where should I eat that locals rate?",
    "What's the weather risk on these dates?",
  ];
  if (has(q.toLowerCase(), "cheap")) {
    return ["Cut a night instead", "Switch to the coach", "Show me the cheapest food", "Rebuild the whole plan"];
  }
  return base.slice(0, 4);
}

export function openingQuestion(ctx: AssistantContext): string {
  const t = ctx.trip;
  const remaining = t.budget_total - ctx.plannedSpend;
  return [
    `Before I start rearranging things — I've read your ${t.destination} plan.`,
    `${ctx.days} days, ${money(t.budget_total, t.currency)} for ${t.travelers} traveller${
      t.travelers > 1 ? "s" : ""
    }, currently sitting ${money(Math.abs(remaining), t.currency)} ${remaining >= 0 ? "under" : "over"} budget.`,
    `Is this a trip where you want to see a lot, or a trip where you want to come back rested? Those are different itineraries and I'd hate to build the wrong one.`,
  ].join(" ");
}

export const BUDGET_HEALTH = (budget: number, planned: number) => {
  const r = budget > 0 ? planned / budget : 0;
  if (r > 1.05) return { label: "Over budget", tone: "danger" as const, ratio: r };
  if (r > 0.9) return { label: "Tight", tone: "warn" as const, ratio: r };
  if (r > 0.55) return { label: "On track", tone: "good" as const, ratio: r };
  return { label: "Under budget", tone: "good" as const, ratio: r };
};

export const tripDurationText = (a: string, b: string) =>
  `${fmtDate(a)} – ${fmtDate(b)}`;
