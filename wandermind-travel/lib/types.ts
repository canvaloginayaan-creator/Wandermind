export type Personality =
  | "foodie"
  | "adventure"
  | "nature"
  | "culture"
  | "nightlife"
  | "relax"
  | "backpacker"
  | "luxury"
  | "family"
  | "photo"
  | "shopping";

export const PERSONALITIES: {
  id: Personality;
  label: string;
  emoji: string;
  blurb: string;
}[] = [
  { id: "foodie", label: "Foodie", emoji: "🍛", blurb: "Travels for the next great plate." },
  { id: "adventure", label: "Adventure Seeker", emoji: "🥾", blurb: "Treks, rafting, altitude, adrenaline." },
  { id: "nature", label: "Nature Lover", emoji: "🏔️", blurb: "Valleys, lakes, forests, quiet." },
  { id: "culture", label: "Culture & History", emoji: "🕌", blurb: "Forts, shrines, old cities." },
  { id: "nightlife", label: "Nightlife", emoji: "🌙", blurb: "Rooftops, music, late dinners." },
  { id: "relax", label: "Relaxation", emoji: "☕", blurb: "Slow mornings, spas, views." },
  { id: "backpacker", label: "Budget Backpacker", emoji: "🎒", blurb: "Cheap beds, big days." },
  { id: "luxury", label: "Luxury", emoji: "🥂", blurb: "Boutique stays, private transfers." },
  { id: "family", label: "Family-Friendly", emoji: "👨‍👩‍👧", blurb: "Short drives, safe food, naps." },
  { id: "photo", label: "Photography", emoji: "📷", blurb: "Golden hour is the itinerary." },
  { id: "shopping", label: "Shopping", emoji: "🧵", blurb: "Bazaars, textiles, ceramics." },
];

export const personalityLabel = (id: string) =>
  PERSONALITIES.find((p) => p.id === id)?.label ?? id;

export type Pace = "slow" | "balanced" | "packed";

export const PACES: { id: Pace; label: string; blurb: string }[] = [
  { id: "slow", label: "Slow", blurb: "1–2 things a day, long lunches." },
  { id: "balanced", label: "Balanced", blurb: "2–3 things a day, one anchor." },
  { id: "packed", label: "Packed", blurb: "Sunrise starts, late finishes." },
];

export type TripStatus = "draft" | "planned" | "booked" | "archived";

export type ItineraryKind = "transport" | "stay" | "food" | "activity" | "note";

export type ExpenseCategory = "transport" | "stay" | "food" | "activity" | "shopping" | "other";

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; color: string; icon: string }[] = [
  { id: "transport", label: "Transport", color: "#7fd8c9", icon: "route" },
  { id: "stay", label: "Stay", color: "#c7ab79", icon: "bed" },
  { id: "food", label: "Food", color: "#ffb457", icon: "utensils" },
  { id: "activity", label: "Activities", color: "#a99bff", icon: "ticket" },
  { id: "shopping", label: "Shopping", color: "#f58ea8", icon: "bag" },
  { id: "other", label: "Other", color: "#9fb3ae", icon: "dots" },
];

export type User = {
  id: string;
  email: string;
  name: string;
  home_city: string;
  currency: string;
  avatar_hue: number;
  created_at: string;
};

export type Trip = {
  id: string;
  user_id: string;
  title: string;
  origin: string;
  destination: string;
  country: string;
  start_date: string;
  end_date: string;
  budget_total: number;
  currency: string;
  travelers: number;
  personalities: string[]; // json
  pace: Pace;
  status: TripStatus;
  cover_image: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ItineraryItem = {
  id: string;
  trip_id: string;
  day_date: string;
  position: number;
  kind: ItineraryKind;
  title: string;
  subtitle: string;
  start_time: string;
  end_time: string;
  location_name: string;
  cost: number;
  booking_url: string;
  booking_label: string;
  provider_name: string;
  image: string;
  rating: number | null;
  price_band: string;
  map_url: string;
  tags: string[];
  is_live: number;
  meta: Record<string, string> | null;
  created_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  user_id: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  currency: string;
  spent_on: string;
  kind: "planned" | "actual";
  created_at: string;
};

export type SavedPlace = {
  id: string;
  user_id: string;
  trip_id: string | null;
  name: string;
  city: string;
  category: string;
  note: string;
  image: string;
  rating: number | null;
  price_band: string;
  map_url: string;
  url: string;
  created_at: string;
};

export type Message = {
  id: string;
  trip_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type TripSummary = Trip & {
  itinerary_count: number;
  planned_spend: number;
  logged_spend: number;
};
