export type FlightOption = {
  id: string;
  airline: string;
  airline_code: string;
  flight_no: string;
  from_city: string;
  from_code: string;
  to_city: string;
  to_code: string;
  depart_date: string;
  arrive_date: string;
  depart_time: string;
  arrive_time: string;
  duration_min: number;
  stops: number;
  cabin: "Economy" | "Premium Economy" | "Business";
  price: number;
  currency: string;
  baggage: string;
  refundable: boolean;
  provider_name: string;
  booking_url: string;
  booking_label: string;
  is_live: boolean;
};

export type IntercityOption = {
  id: string;
  mode: "train" | "bus" | "car" | "flight";
  operator: string;
  from_city: string;
  to_city: string;
  depart_time: string;
  arrive_time: string;
  duration_min: number;
  distance_km: number;
  price: number;
  currency: string;
  comfort: 1 | 2 | 3 | 4 | 5;
  notes: string;
  booking_url: string;
  booking_label: string;
  provider_name?: string;
  is_live: boolean;
};

export type StayOption = {
  id: string;
  name: string;
  city: string;
  area: string;
  type: "guesthouse" | "hotel" | "boutique" | "resort" | "hostel" | "apartment";
  nightly_price: number;
  currency: string;
  rating: number;
  review_count: number;
  perks: string[];
  image: string;
  map_url: string;
  booking_url: string;
  booking_label: string;
  is_live: boolean;
};

export interface TravelProvider {
  readonly name: string;
  readonly isLive: boolean;
  searchFlights(input: {
    fromCity: string;
    toCity: string;
    date: string;
    travelers: number;
    cabin?: string;
  }): Promise<FlightOption[]>;
  searchFlightsRange(input: {
    fromCity: string;
    toCity: string;
    startDate: string;
    endDate: string;
    travelers: number;
  }): Promise<FlightOption[]>;
  searchIntercity(input: {
    fromCity: string;
    toCity: string;
    date: string;
    travelers: number;
  }): Promise<IntercityOption[]>;
  searchStays(input: {
    city: string;
    checkIn: string;
    checkOut: string;
    travelers: number;
    budgetPerNight: number;
  }): Promise<StayOption[]>;
}
