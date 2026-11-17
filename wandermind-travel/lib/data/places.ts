import type { Personality } from "../types";

export type PlaceSeed = {
  name: string;
  city: string;
  area: string;
  category: "food" | "activity" | "nature" | "culture" | "nightlife" | "shopping" | "stay" | "cafe";
  rating: number;
  band: "$" | "$$" | "$$$" | "$$$$";
  cost: number; // typical per-person PKR
  hours: string;
  tags: Personality[];
  blurb: string;
  image: string;
};

const IMG = {
  food: "/img/food-karahi.jpg",
  street: "/img/food-street.jpg",
  cafe: "/img/food-cafe.jpg",
  sea: "/img/food-seafood.jpg",
  hunza: "/img/dest-hunza.jpg",
  skardu: "/img/dest-skardu.jpg",
  lahore: "/img/dest-lahore.jpg",
  karachi: "/img/dest-karachi.jpg",
  murree: "/img/dest-murree.jpg",
};

const p = (
  name: string,
  city: string,
  area: string,
  category: PlaceSeed["category"],
  rating: number,
  band: PlaceSeed["band"],
  cost: number,
  hours: string,
  tags: Personality[],
  blurb: string,
  image: string
): PlaceSeed => ({ name, city, area, category, rating, band, cost, hours, tags, blurb, image });

export const PLACES: PlaceSeed[] = [
  // ---------------- KARACHI ----------------
  p("Kolachi", "Karachi", "Do Darya, Phase 8", "food", 4.4, "$$$", 3200, "12:00 – 01:00", ["foodie", "family"], "Sea-facing desi grill house. Order the mutton karahi and the pomfret; go at sunset and ask for a table on the outer deck.", IMG.sea),
  p("Burns Road Food Street", "Karachi", "Burns Road, Saddar", "food", 4.6, "$", 650, "18:00 – 02:00", ["foodie", "backpacker", "photo"], "The old city's stomach: nihari, gola kabab, falooda. Start at Waheed Kabab House and walk. Cash only, keep it to the crowded stalls.", IMG.street),
  p("Cafe Flo", "Karachi", "E Street, Block 4, Clifton", "cafe", 4.3, "$$", 1800, "10:00 – 23:30", ["relax", "foodie"], "Garden café in an old bungalow. Slow breakfast, good coffee, quiet enough to actually read a book.", IMG.cafe),
  p("Xander's", "Karachi", "Boat Basin, Clifton", "food", 4.2, "$$", 2200, "09:00 – 23:00", ["foodie", "family"], "Reliable all-day kitchen — English breakfast, sandwiches, desi mains. Easy first meal when you land.", IMG.cafe),
  p("Mohatta Palace Museum", "Karachi", "Clifton", "culture", 4.5, "$$", 500, "11:00 – 18:00 (closed Mon)", ["culture", "photo"], "Pink Jodhpur-stone palace turned gallery. Two hours, air-conditioned, excellent for a hot afternoon.", IMG.karachi),
  p("Clifton Sea View & Bayside Walk", "Karachi", "Clifton Block 1", "nature", 4.1, "$", 0, "Open 24h", ["relax", "photo", "family"], "Camel rides and chai at sunset. Loud, chaotic, genuinely Karachi. Go after 5pm only.", IMG.karachi),
  p("Empress Market", "Karachi", "Saddar", "shopping", 4.4, "$", 1200, "08:00 – 20:00", ["shopping", "photo", "culture"], "1874 Gothic market. Spices, dry fruit, textiles upstairs. Go early with a local, take photos before the crush.", IMG.karachi),
  p("Chai Wala at Frere Hall", "Karachi", "Civil Lines", "cafe", 4.2, "$", 300, "16:00 – 23:00", ["relax", "backpacker"], "Evening lawn with the Frere Hall facade behind you. Doodh patti and samosas, cheap and perfect.", IMG.cafe),
  p("Sabri Nihari", "Karachi", "M.A. Jinnah Road", "food", 4.5, "$", 800, "06:00 – 02:00", ["foodie", "culture"], "The nihari institution. Order with nalli and extra ginger; eat standing if you have to.", IMG.food),
  p("Al Bustan", "Karachi", "Zamzama", "food", 4.3, "$$$", 3400, "12:30 – 01:00", ["foodie", "family"], "Saudi-Pakistani grill house — mandi and whole grilled fish. Book a table on weekends.", IMG.food),
  p("Barbecue Tonight", "Karachi", "Multiple — try Khayaban-e-Bukhari", "food", 4.3, "$$", 1900, "18:30 – 01:30", ["foodie", "nightlife"], "Dependable seekh-kebab-and-naan dinner when you don't want an adventure. Ask for extra chutney.", IMG.food),

  // ---------------- LAHORE ----------------
  p("Haveli Restaurant", "Lahore", "Fort Road Food Street", "food", 4.4, "$$$", 3500, "12:00 – 00:00", ["foodie", "culture", "photo"], "Rooftop directly facing Badshahi Mosque. The food is good, the view is the reason. Book the top terrace at 6pm.", IMG.lahore),
  p("Phajja Siri Paye", "Lahore", "Kashmir Road", "food", 4.5, "$", 700, "06:00 – 13:00", ["foodie", "backpacker"], "Breakfast institution since 1910. Siri paye with kulcha — go before 9am, it sells out.", IMG.food),
  p("Wazir Khan Mosque", "Lahore", "Walled City", "culture", 4.7, "$$", 300, "08:00 – 20:00", ["culture", "photo"], "Finest tilework in South Asia. 30 minutes inside is enough; pair it with Delhi Gate bazaar.", IMG.lahore),
  p("Badshahi Mosque & Lahore Fort", "Lahore", "Walled City", "culture", 4.8, "$$", 800, "08:00 – 18:00", ["culture", "photo", "family"], "Do the mosque at golden hour, fort in the morning. Combined ticket, guide ~PKR 2,000 worth it.", IMG.lahore),
  p("Andaz", "Lahore", "Gulberg III", "cafe", 4.2, "$$", 1600, "08:00 – 23:00", ["relax", "foodie"], "Calm courtyard breakfast, proper coffee, no chaos. Good base before a Gulberg shopping day.", IMG.cafe),
  p("Liberty Market", "Lahore", "Gulberg", "shopping", 4.2, "$", 2500, "11:00 – 22:00", ["shopping", "foodie"], "Kurtas, khussas, and the best cheap chaat in the city at the back lanes. Bargain hard.", IMG.street),
  p("Shalimar Gardens", "Lahore", "Baghbanpura", "culture", 4.5, "$", 300, "08:00 – 18:00", ["culture", "relax", "photo"], "Mughal terraced gardens, UNESCO listed. Morning light, low crowds, 90 minutes.", IMG.lahore),
  p("Butt Karahi", "Lahore", "Ichhra / Barkat Market", "food", 4.6, "$$", 1500, "17:00 – 01:00", ["foodie", "nightlife"], "The karahi benchmark. Order by weight, wait 30 minutes, eat with naan and nothing else.", IMG.food),
  p("Delhi Gate & Shahi Hammam", "Lahore", "Walled City", "culture", 4.4, "$$", 600, "09:00 – 17:00", ["culture", "photo"], "Restored Mughal bathhouse plus a walk into the old mohallas. Hire the ₹500 guide, it's worth it.", IMG.lahore),
  p("Cuckoo's Den", "Lahore", "Gulberg II", "nightlife", 4.1, "$$", 2400, "19:00 – 02:00", ["nightlife", "relax"], "Quiet courtyard bar-restaurant; one of the few relaxed late-evening spots that isn't a wedding hall.", IMG.cafe),
  p("Coffee Bean & Tea Leaf", "Lahore", "MM Alam Road", "cafe", 4.0, "$$", 1400, "08:00 – 23:00", ["relax", "foodie"], "Reliable air-conditioned coffee stop mid-shopping. Nothing remarkable, always works.", IMG.cafe),
  p("Neco's", "Lahore", "Fort Road", "cafe", 4.1, "$", 900, "07:00 – 22:00", ["backpacker", "family"], "Old-school bakery near the fort. Good patties, cheap tea, seats outside.", IMG.cafe),
  p("Nisar Charsi Tikka", "Lahore", "Nishtar Colony", "food", 4.5, "$$", 1300, "18:00 – 01:30", ["foodie", "nightlife"], "The tikka everyone argues about. Charcoal, butter, no cutlery. Cash only, arrive before 9pm.", IMG.food),
  p("Bundu Khan", "Lahore", "Gulberg", "food", 4.2, "$$", 1500, "12:00 – 23:30", ["family", "foodie"], "Old Lahore chain — reliable BBQ and karahi when you don't want to gamble on a stall.", IMG.food),

  // ---------------- HUNZA ----------------
  p("Baltit Fort", "Hunza", "Karimabad", "culture", 4.6, "$$", 700, "09:00 – 17:30", ["culture", "photo", "nature"], "900-year-old fort on the ridge with the whole valley below. Go at 9am for clean air and clear peaks.", IMG.hunza),
  p("Altit Fort & Royal Garden", "Hunza", "Altit", "culture", 4.5, "$$", 600, "09:00 – 17:00", ["culture", "nature"], "Older than Baltit, quieter, better garden. Combine with a walk down through the old village.", IMG.hunza),
  p("Attabad Lake", "Hunza", "Gojal", "nature", 4.7, "$", 500, "Daylight", ["nature", "photo", "adventure"], "Impossible turquoise. Boating is PKR 1,500/head extra; the viewpoint on the KKH is free and better light at 4pm.", IMG.hunza),
  p("Eagle's Nest Viewpoint", "Hunza", "Duikar", "nature", 4.8, "$", 800, "Sunrise / Sunset", ["photo", "nature", "relax"], "360° on Rakaposhi, Ladyfinger, Ultar. Go for sunrise, stay for chai. Road is rough — take a jeep.", IMG.hunza),
  p("Rakaposhi View Guesthouse Café", "Hunza", "Nagore", "cafe", 4.4, "$$", 1200, "08:00 – 21:00", ["relax", "nature", "photo"], "Apricot cake and coffee with the mountain filling the window. Best slow afternoon in the valley.", IMG.cafe),
  p("Cafe de Hunza", "Hunza", "Karimabad", "food", 4.3, "$$", 1600, "10:00 – 22:00", ["foodie", "relax"], "Walnut cake, apricot soup, momos. Warm indoor seating when the valley wind picks up.", IMG.food),
  p("Karimabad Bazaar", "Hunza", "Karimabad", "shopping", 4.2, "$", 2000, "10:00 – 20:00", ["shopping", "culture"], "Hunza caps, gemstones, dried apricots. Fixed-price shops at the top end, bargain in the middle.", IMG.hunza),
  p("Ultar Sar Base Trek", "Hunza", "Karimabad", "activity", 4.7, "$", 0, "Morning start", ["adventure", "nature"], "3–4 hours return, steep but no technical gear. Check with your hotel on trail conditions; go with a guide.", IMG.hunza),
  p("Hopper Valley & Rush Lake Trailhead", "Hunza", "Hopper", "nature", 4.5, "$", 3000, "Daylight", ["adventure", "photo"], "Glacier moraine and a dramatic side valley. Needs a 4x4 and half a day — budget PKR 8,000 for the jeep.", IMG.hunza),
  p("Attabad Boating & Gojal Farm Lunch", "Hunza", "Gulmit", "food", 4.3, "$$", 1400, "11:00 – 18:00", ["foodie", "nature"], "Farmhouse lunch — chapshuro, apricot jam, fresh bread — after the lake. Ask your driver for Mahmood's place.", IMG.food),
  p("Hidden Paradise Café", "Hunza", "Karimabad", "cafe", 4.2, "$$", 1100, "09:00 – 21:00", ["relax", "photo"], "Hillside terrace, apricot jam and flat whites. Quiet mid-afternoon, best light at 5pm.", IMG.cafe),
  p("Glacier Bistro", "Hunza", "Karimabad", "food", 4.1, "$$", 1900, "11:00 – 22:00", ["foodie", "nature"], "Hunza-style trout and chapshuro with glacier views from the terrace. Ask for the apricot chutney.", IMG.food),
  p("Breeze Hunza Café", "Hunza", "Aliabad", "cafe", 4.0, "$$", 900, "08:00 – 22:00", ["backpacker", "relax"], "Cheap breakfast and decent chai on the main road. Where the drivers eat.", IMG.cafe),

  // ---------------- SKARDU ----------------
  p("Shangrila (Lower Kachura) Lake", "Skardu", "Kachura", "nature", 4.6, "$$", 600, "Daylight", ["nature", "photo", "relax"], "Postcard lake with red-roofed resort. Day pass + boating ≈ PKR 3,000. Morning is glassy, afternoon is windy.", IMG.skardu),
  p("Upper Kachura Lake", "Skardu", "Kachura", "nature", 4.5, "$", 400, "Daylight", ["nature", "adventure"], "Steeper, wilder, fewer people than Lower Kachura. 20 minutes further up a rough track.", IMG.skardu),
  p("Shigar Fort (Serena)", "Skardu", "Shigar", "culture", 4.6, "$$$", 1200, "09:00 – 18:00", ["culture", "luxury", "photo"], "Restored 17th-century Raja's palace, now a Serena heritage hotel. Coffee in the garden even if you don't stay.", IMG.skardu),
  p("Katpana Cold Desert", "Skardu", "Katpana", "nature", 4.4, "$", 0, "Sunset", ["photo", "nature", "relax"], "Sand dunes at 2,200m with snow peaks behind. Ten minutes from town — the easiest win in Skardu.", IMG.skardu),
  p("Deosai National Park", "Skardu", "Deosai Plains", "nature", 4.9, "$$$", 4500, "Jun–Sep only", ["adventure", "nature", "photo"], "The Land of Giants at 4,100m. Full-day jeep, brown bear country, no phone signal. Only June–September.", IMG.skardu),
  p("Manthokha Waterfall", "Skardu", "Kharmang", "nature", 4.3, "$$", 500, "Daylight", ["nature", "family"], "Roadside waterfall with trout grills. Easy stop on the Kharmang loop, 90 minutes from town.", IMG.skardu),
  p("Yak Grill & Trout House", "Skardu", "Skardu Bazaar", "food", 4.2, "$$", 1500, "12:00 – 22:00", ["foodie", "adventure"], "Grilled trout from the Indus tributaries and a solid yak stew. Simple room, honest prices.", IMG.food),
  p("Shangrila Restaurant", "Skardu", "Kachura", "food", 4.1, "$$", 1800, "12:00 – 21:00", ["family", "nature"], "Lakeside dining attached to the resort — trout, rice, and a view across the water.", IMG.food),
  p("Kharpocho Fort", "Skardu", "Skardu Town", "culture", 4.3, "$", 400, "09:00 – 17:00", ["culture", "photo"], "Short steep climb above the bazaar for the valley panorama. 45 minutes, bring water.", IMG.skardu),
  p("Dewanekhas Café", "Skardu", "Skardu Town", "cafe", 4.1, "$$", 1000, "10:00 – 22:00", ["relax", "foodie"], "Warm indoor café on the main bazaar road. Best coffee between Gilgit and Khaplu.", IMG.cafe),
  p("Shangrila Lakeside Café", "Skardu", "Kachura", "cafe", 4.0, "$$", 1300, "09:00 – 20:00", ["relax", "nature"], "Simple lakeside tea house — walnut cake and trout sandwiches with the water right there.", IMG.cafe),

  // ---------------- ISLAMABAD ----------------
  p("Faisal Mosque", "Islamabad", "F-6", "culture", 4.8, "$", 0, "08:00 – 22:00", ["culture", "photo", "family"], "Still the most striking building in the country. Free, 45 minutes, best in late light.", IMG.lahore),
  p("Monal", "Islamabad", "Pir Sohawa", "food", 4.3, "$$$", 3000, "12:00 – 00:00", ["foodie", "family", "photo"], "Terrace over the whole city. Food is fine, the view is why you're here — go at dusk.", IMG.food),
  p("Trail 5 & Margalla Hills", "Islamabad", "F-5 / Pir Sohawa", "activity", 4.6, "$", 0, "Sunrise – Sunset", ["adventure", "nature"], "2–3 hour hike to Pir Sohawa, monkeys included. Start by 7am in summer. Stick to the marked trail.", IMG.murree),
  p("Saidpur Village", "Islamabad", "Saidpur", "culture", 4.3, "$$", 900, "10:00 – 23:00", ["culture", "foodie", "relax"], "Restored 500-year-old village, cafés in old houses. Good for a slow evening, avoid weekends.", IMG.cafe),
  p("Raja Bazaar & Aabpara", "Islamabad", "Aabpara", "shopping", 4.0, "$", 1500, "10:00 – 21:00", ["shopping", "foodie"], "Chaos with excellent cheap food. Try the Kashmiri tea stalls behind Aabpara market.", IMG.street),
  p("Lok Virsa Museum", "Islamabad", "Garden Avenue", "culture", 4.4, "$$", 500, "10:00 – 18:00", ["culture", "family"], "Regional crafts and folk heritage, properly curated. Two hours of air conditioning.", IMG.lahore),
  p("Margala Viewpoint & PIA Planetarium Walk", "Islamabad", "Shakarparian", "nature", 4.2, "$", 0, "Daylight", ["relax", "family"], "Gardens, lake, and a soft walk. Ideal for a jet-lagged first afternoon.", IMG.murree),
  p("Kabul Restaurant", "Islamabad", "Blue Area", "food", 4.4, "$$", 1700, "12:00 – 23:30", ["foodie", "family"], "Afghan-style namkeen tikka and Kabuli pulao. Loud, busy, consistently good for 30 years.", IMG.food),
  p("Butlers Chocolate Café", "Islamabad", "F-6 Kohsar Market", "cafe", 4.3, "$$", 1500, "09:00 – 23:00", ["relax", "foodie"], "Quiet booths, good hot chocolate, the sort of place you recover in after a Margalla hike.", IMG.cafe),

  // ---------------- MURREE ----------------
  p("Mall Road Murree", "Murree", "Mall Road", "shopping", 4.0, "$$", 1200, "10:00 – 22:00", ["shopping", "family"], "Colonial-era promenade, souvenir shops, corn on the cob. Touristy but fun for an hour.", IMG.murree),
  p("Patriata (New Murree) Chairlift", "Murree", "Patriata", "activity", 4.2, "$$", 1500, "09:00 – 18:00", ["family", "adventure", "photo"], "Chairlift over the pines. Skip on public holidays — the queue eats your day.", IMG.murree),
  p("Nathia Gali & Mukshpuri Trail", "Murree", "Nathia Gali", "activity", 4.6, "$", 0, "Morning start", ["adventure", "nature", "photo"], "3-hour ridge walk through deodar forest to 2,800m. Cool even in July, misty in monsoon.", IMG.murree),
  p("Bhurban Forest Walk", "Murree", "Bhurban", "nature", 4.3, "$", 0, "Daylight", ["nature", "relax"], "Quiet pine loops behind the PC. The anti-Mall-Road option.", IMG.murree),
  p("Kashmir Point", "Murree", "Mall Road", "nature", 4.1, "$", 200, "Sunrise – Sunset", ["photo", "family"], "Valley view toward Kashmir. Crystal clear in winter, clouded in July.", IMG.murree),
  p("Red Onion / Lintott's", "Murree", "Mall Road", "food", 4.0, "$$", 1800, "12:00 – 23:00", ["foodie", "family"], "Warm indoor dining when the mist rolls in. Trout and soups are the safe order.", IMG.food),
  p("Gloria Jean's Bhurban", "Murree", "Bhurban", "cafe", 4.1, "$$", 1300, "08:00 – 22:00", ["relax", "family"], "Pine-view coffee stop next to the PC. Touristy pricing, unbeatable window.", IMG.cafe),
  p("Cafe De Galyat", "Murree", "Nathia Gali", "cafe", 4.2, "$$", 1100, "09:00 – 21:00", ["relax", "nature"], "Small hillside café, hot soup and chai after the Mukshpuri walk.", IMG.cafe),

  // ---------------- DUBAI ----------------
  p("Al Ustad Special Kabab", "Dubai", "Al Fahidi", "food", 4.6, "$", 1600, "12:00 – 23:30", ["foodie", "culture"], "Iranian kebab house running since 1978. Walls covered in photos, prices untouched by the skyline.", IMG.food),
  p("Dubai Creek Abra Ride", "Dubai", "Deira / Bur Dubai", "activity", 4.7, "$", 100, "05:00 – 00:00", ["culture", "photo", "backpacker"], "AED 1 wooden boat across the creek. The cheapest 20 minutes in the city and the best photo opportunity.", IMG.karachi),
  p("Gold & Spice Souk", "Dubai", "Deira", "shopping", 4.2, "$$", 3000, "10:00 – 22:00", ["shopping", "culture"], "Start at the spice souk for photos, then the gold souk to window-shop. Bargain or walk.", IMG.street),
  p("Dubai Museum (Al Fahidi Fort)", "Dubai", "Al Fahidi", "culture", 4.4, "$$", 500, "08:30 – 20:30", ["culture", "family"], "Oldest building in the city, good desert-and-pearl-diving history. 90 minutes, air conditioned.", IMG.lahore),
  p("Kite Beach", "Dubai", "Jumeirah", "nature", 4.5, "$", 0, "Open 24h", ["relax", "family", "photo"], "Free beach with a proper Dubai skyline view. Go at 6pm, eat from the food trucks.", IMG.sea),
  p("Ravi Restaurant", "Dubai", "Satwa", "food", 4.3, "$", 1200, "05:00 – 02:00", ["foodie", "backpacker"], "Pakistani institution in Satwa. Nihari and naan at 1am, still full. Cash-friendly.", IMG.food),
  p("Alserkal Avenue", "Dubai", "Al Quoz", "culture", 4.5, "$$", 1500, "10:00 – 20:00 (closed Sun)", ["culture", "photo", "nightlife"], "Warehouse gallery district. Galleries free, coffee expensive, crowd interesting.", IMG.cafe),
  p("Arabian Tea House", "Dubai", "Al Fahidi", "cafe", 4.5, "$$", 2200, "07:00 – 23:00", ["relax", "culture", "foodie"], "Courtyard breakfast in the oldest part of the city. Go before 9am when it's still cool.", IMG.cafe),
  p("Burj Khalifa At The Top", "Dubai", "Downtown", "activity", 4.4, "$$$$", 9000, "08:30 – 23:00", ["luxury", "family", "photo"], "Book the 124th floor sunset slot online in advance — walk-up prices are brutal.", IMG.karachi),

  // ---------------- BANGKOK ----------------
  p("Jay Fai", "Bangkok", "Samran Rat", "food", 4.5, "$$$", 4000, "09:00 – 19:00 (closed Mon–Tue)", ["foodie"], "Michelin-starred crab omelette from a street cart. Queue by 8am, budget 2 hours, worth it once.", IMG.food),
  p("Wat Arun", "Bangkok", "Thonburi", "culture", 4.7, "$$", 700, "08:00 – 18:00", ["culture", "photo"], "Porcelain-studded riverside temple. Cross by ferry at 4pm, climb the steep steps for the sunset.", IMG.lahore),
  p("Chatuchak Weekend Market", "Bangkok", "Chatuchak", "shopping", 4.5, "$", 2500, "09:00 – 18:00 (Sat–Sun)", ["shopping", "foodie", "backpacker"], "15,000 stalls. Weekend only. Go early, carry cash, drink coconut water between sections.", IMG.street),
  p("Yaowarat Street Food Crawl", "Bangkok", "Chinatown", "food", 4.6, "$", 1200, "17:00 – 00:00", ["foodie", "nightlife", "photo"], "Start at Nai Ek Roll Noodles, end at the mango sticky rice cart. Best meal-per-baht in the city.", IMG.street),
  p("Lumphini Park", "Bangkok", "Silom", "nature", 4.5, "$", 0, "04:30 – 21:00", ["relax", "family"], "Monitor lizards, paddle boats, morning tai chi. Free green escape between temples.", IMG.murree),
  p("Jim Thompson House", "Bangkok", "Rama I", "culture", 4.5, "$$", 1200, "10:00 – 18:00", ["culture", "shopping"], "Silk merchant's teak compound. Guided tour only, 45 minutes, excellent shop.", IMG.cafe),
  p("Supanniga Eating Room", "Bangkok", "Tha Tien", "food", 4.4, "$$$", 2800, "11:00 – 22:00", ["foodie", "relax"], "Riverside Thai home cooking with a view of Wat Arun lit up. Book the balcony.", IMG.food),
  p("Roast Coffee & Eatery", "Bangkok", "Thonglor", "cafe", 4.4, "$$", 1600, "09:00 – 22:00", ["relax", "foodie"], "Serious brunch and properly good coffee. The escape from street-food overload.", IMG.cafe),

  // ---------------- ISTANBUL ----------------
  p("Sultanahmet & Hagia Sophia", "Istanbul", "Sultanahmet", "culture", 4.8, "$$$", 3000, "09:00 – 18:00", ["culture", "photo"], "Timed-entry ticket, go first thing. Blue Mosque is a two-minute walk with free entry.", IMG.lahore),
  p("Grand Bazaar", "Istanbul", "Beyazıt", "shopping", 4.3, "$$", 3000, "09:00 – 19:00 (closed Sun)", ["shopping", "culture"], "4,000 shops, 61 streets. Walk in with a destination or you'll be lost in the best way.", IMG.street),
  p("Karaköy Lokantası", "Istanbul", "Karaköy", "food", 4.5, "$$$", 3200, "12:00 – 23:00", ["foodie", "nightlife"], "Proper meyhane — order the mezze spread and let the waiter choose the fish.", IMG.food),
  p("Bosphorus Ferry to Kadıköy", "Istanbul", "Eminönü", "activity", 4.7, "$", 250, "05:00 – 23:00", ["relax", "photo", "backpacker"], "Public ferry, coastal palace views, cheap tea on deck. The single best value thing in Istanbul.", IMG.sea),
  p("Balat Colourful Streets", "Istanbul", "Balat", "culture", 4.6, "$", 900, "Daylight", ["photo", "culture", "foodie"], "Coloured houses, antique lanes, church domes. Coffee at one of the tiny cafés at the bottom of the hill.", IMG.cafe),
  p("Kadıköy Market", "Istanbul", "Kadıköy", "food", 4.6, "$$", 1100, "08:00 – 21:00", ["foodie", "shopping"], "Cheese, olives, pickles, and cheap eats. The Asian side eats better and charges less.", IMG.street),
  p("Çiya Sofrası", "Istanbul", "Kadıköy", "food", 4.6, "$$", 1900, "11:00 – 22:00", ["foodie", "culture"], "Anatolian home cooking that changes daily. Point at what looks good; you'll be right.", IMG.food),
  p("Fazıl Bey", "Istanbul", "Kadıköy", "cafe", 4.5, "$", 400, "07:00 – 22:00", ["backpacker", "foodie"], "Turkish coffee institution since 1923. Ask for medium sugar and sit outside.", IMG.cafe),
];

export type DestinationTheme = {
  id: string;
  city: string;
  country: string;
  tagline: string;
  blurb: string;
  image: string;
  personalities: Personality[];
  best_months: string[];
  daily_band: number; // mid-range per person per day, PKR
  airport: string;
  airport_code: string;
  weather_note: string;
  highlights: string[];
};

export const DESTINATIONS: DestinationTheme[] = [
  {
    id: "hunza",
    city: "Hunza",
    country: "Pakistan",
    tagline: "Karimabad, forts and the Rakaposhi wall",
    blurb:
      "Nine hours up the Karakoram Highway and the air changes completely. Hunza rewards slow travel: one fort in the morning, one viewpoint at sunset, apricot cake in between.",
    image: "/img/dest-hunza.jpg",
    personalities: ["nature", "adventure", "photo", "culture"],
    best_months: ["April", "May", "June", "September", "October"],
    daily_band: 12500,
    airport: "Gilgit Airport",
    airport_code: "GIL",
    weather_note: "Apr–Oct is the window. Autumn (mid-Oct) is the golden poplar season and the reason people come.",
    highlights: ["Baltit Fort", "Attabad Lake", "Eagle's Nest sunrise", "Ultar Sar base trek"],
  },
  {
    id: "skardu",
    city: "Skardu",
    country: "Pakistan",
    tagline: "Cold deserts, turquoise lakes, high Karakoram",
    blurb:
      "Skardu is Hunza's rawer sibling — colder, emptier, and the gateway to Deosai and K2 treks. Weather decides your itinerary here, not you.",
    image: "/img/dest-skardu.jpg",
    personalities: ["adventure", "nature", "photo"],
    best_months: ["June", "July", "August", "September"],
    daily_band: 14000,
    airport: "Skardu Airport",
    airport_code: "KDU",
    weather_note: "Jun–Sep only for Deosai. Flights cancel often — always keep a road contingency.",
    highlights: ["Shangrila Lake", "Katpana Desert", "Deosai Plains", "Shigar Fort"],
  },
  {
    id: "lahore",
    city: "Lahore",
    country: "Pakistan",
    tagline: "Mughal scale, Walled City lanes, serious eating",
    blurb:
      "The densest concentration of food and history in Pakistan. Two nights barely scratches it; three lets you eat properly.",
    image: "/img/dest-lahore.jpg",
    personalities: ["foodie", "culture", "shopping", "nightlife"],
    best_months: ["February", "March", "November", "December"],
    daily_band: 9500,
    airport: "Allama Iqbal International",
    airport_code: "LHE",
    weather_note: "Avoid May–July (40°C+). December is fog-risky for flights but the food is worth the delay.",
    highlights: ["Badshahi Mosque", "Wazir Khan tilework", "Butt Karahi", "Fort Road Food Street"],
  },
  {
    id: "karachi",
    city: "Karachi",
    country: "Pakistan",
    tagline: "Sea air, old money, the best cheap food in the country",
    blurb:
      "Not a pretty city, but the most alive one. Plan around evenings and the coast; the afternoons belong to air conditioning.",
    image: "/img/dest-karachi.jpg",
    personalities: ["foodie", "nightlife", "culture"],
    best_months: ["November", "December", "January", "February"],
    daily_band: 9000,
    airport: "Jinnah International",
    airport_code: "KHI",
    weather_note: "Nov–Feb is perfect. Monsoon (Jul–Aug) means flooded roads and cancelled plans.",
    highlights: ["Burns Road crawl", "Clifton sunset", "Mohatta Palace", "Empress Market"],
  },
  {
    id: "murree",
    city: "Murree",
    country: "Pakistan",
    tagline: "Pine air, three hours from Islamabad",
    blurb:
      "The easy mountain escape. Murree itself is crowded — Nathia Gali and Bhurban, twenty minutes further, are where it gets quiet.",
    image: "/img/dest-murree.jpg",
    personalities: ["nature", "family", "relax"],
    best_months: ["April", "May", "June", "December", "January"],
    daily_band: 10000,
    airport: "Islamabad International",
    airport_code: "ISB",
    weather_note: "Snow Jan–Feb (chains required). July–Aug monsoon fog ruins the views.",
    highlights: ["Nathia Gali trail", "Patriata chairlift", "Bhurban forest", "Mall Road"],
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    tagline: "Skyline, creek, and the Gulf's best Pakistani food",
    blurb:
      "Three days is the sweet spot: old Deira first, the shiny bits second, and one desert evening. Value lives in Satwa and Al Fahidi.",
    image: "/img/dest-karachi.jpg",
    personalities: ["luxury", "shopping", "family", "foodie"],
    best_months: ["November", "December", "January", "February", "March"],
    daily_band: 26000,
    airport: "Dubai International",
    airport_code: "DXB",
    weather_note: "Nov–Mar is the only comfortable window outdoors. Summer is 45°C and indoors-only.",
    highlights: ["Abra creek crossing", "Al Ustad kababs", "Alserkal Avenue", "Kite Beach"],
  },
  {
    id: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    tagline: "Street food capital with temples and cheap flights",
    blurb:
      "The best value international trip from Pakistan. Eat on the street, sleep near the BTS, and let the temples fill the mornings.",
    image: "/img/dest-lahore.jpg",
    personalities: ["foodie", "shopping", "nightlife", "backpacker"],
    best_months: ["November", "December", "January", "February"],
    daily_band: 16000,
    airport: "Suvarnabhumi",
    airport_code: "BKK",
    weather_note: "Cool dry season Nov–Feb. April is scorching, Jul–Oct is daily downpours.",
    highlights: ["Yaowarat crawl", "Wat Arun sunset", "Chatuchak market", "Lumphini Park"],
  },
  {
    id: "istanbul",
    city: "Istanbul",
    country: "Türkiye",
    tagline: "Two continents, ferries, and a very good breakfast",
    blurb:
      "Walkable, affordable, and the ferries do half the sightseeing for you. Five days minimum; the food alone justifies the flight.",
    image: "/img/dest-skardu.jpg",
    personalities: ["culture", "foodie", "photo", "shopping"],
    best_months: ["April", "May", "September", "October"],
    daily_band: 18000,
    airport: "Istanbul Airport",
    airport_code: "IST",
    weather_note: "Spring and early autumn are ideal. August is hot and packed with Gulf tourists.",
    highlights: ["Hagia Sophia", "Grand Bazaar", "Kadıköy market", "Bosphorus ferry"],
  },
];

export const cityPlaces = (city: string) =>
  PLACES.filter((pl) => pl.city.toLowerCase() === city.toLowerCase());

export const findDestination = (city: string) =>
  DESTINATIONS.find(
    (d) =>
      d.city.toLowerCase() === city.toLowerCase() ||
      d.id === city.toLowerCase()
  );

export const destinationCities = () => DESTINATIONS.map((d) => d.city);
