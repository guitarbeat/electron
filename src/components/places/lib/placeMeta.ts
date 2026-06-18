import { colors } from "@/theme/tokens";

export interface CategoryMeta {
  icon: string;
  color: string;
  label: string;
}

export const getPlaceMeta = (name: string): CategoryMeta => {
  const lower = name.toLowerCase();
  if (/beach|ocean|sea|lake|river|bay|shore|coast|surf|swim/.test(lower))
    return { icon: "🏖️", color: "#4ecdc4", label: "Water" };
  if (
    /park|garden|trail|forest|nature|woods|hike|botanical|grove|meadow/.test(
      lower,
    )
  )
    return { icon: "🌿", color: "#7cb342", label: "Nature" };
  if (
    /restaurant|diner|bistro|brasserie|grill|steakhouse|bbq|sushi|pizza|tacos|ramen|burger/.test(
      lower,
    )
  )
    return { icon: "🍽️", color: "#ff8a65", label: "Dining" };
  if (
    /cafe|coffee|espresso|bakery|patisserie|pastry|boulangerie|tea/.test(lower)
  )
    return { icon: "☕", color: "#bcaaa4", label: "Café" };
  if (/bar|pub|brewery|taproom|cocktail|lounge|nightclub|club|wine/.test(lower))
    return { icon: "🍻", color: "#ffd54f", label: "Drinks" };
  if (/museum|gallery|art|exhibit|modern/.test(lower))
    return { icon: "🎨", color: "#ce93d8", label: "Culture" };
  if (
    /theater|theatre|cinema|movies|show|performance|concert|opera|ballet/.test(
      lower,
    )
  )
    return { icon: "🎭", color: "#ef5350", label: "Entertainment" };
  if (/mountain|hill|peak|summit|climb|rock|canyon|cliff/.test(lower))
    return { icon: "⛰️", color: "#8d6e63", label: "Mountain" };
  if (/shop|store|market|mall|boutique|vintage|thrift/.test(lower))
    return { icon: "🛍️", color: "#f48fb1", label: "Shopping" };
  if (/gym|fitness|yoga|pilates|spa|wellness|sauna/.test(lower))
    return { icon: "🧘", color: "#80deea", label: "Wellness" };
  if (/hotel|resort|airbnb|hostel|motel|inn/.test(lower))
    return { icon: "🏨", color: "#9fa8da", label: "Stay" };
  if (/zoo|aquarium|safari|wildlife|animal/.test(lower))
    return { icon: "🦁", color: "#a5d6a7", label: "Wildlife" };
  if (/library|bookstore|books|reading/.test(lower))
    return { icon: "📚", color: "#90a4ae", label: "Library" };
  if (/airport|station|terminal|train/.test(lower))
    return { icon: "✈️", color: "#b0bec5", label: "Transit" };
  if (/bridge|landmark|tower|castle|palace/.test(lower))
    return { icon: "🏰", color: "#ffcc80", label: "Landmark" };
  if (/island|cove|lagoon|waterfall/.test(lower))
    return { icon: "🌊", color: "#4fc3f7", label: "Island" };
  return { icon: "📍", color: colors.accent, label: "Place" };
};

