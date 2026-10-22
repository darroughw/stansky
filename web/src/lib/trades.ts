// The trade each service falls under, in the words people search with ("deck builder",
// "kitchen remodeling contractor"). Used in each service page's opening line and in its
// structured data. Keyed by the service's slug in Sanity; a service missing here simply
// gets neither, so a new service never shows a wrong trade.
export const serviceTrades: Record<string, string> = {
  'decks-and-porches': 'deck and porch builder',
  'bathroom-remodeling': 'bathroom remodeling contractor',
  'kitchen-remodeling': 'kitchen remodeling contractor',
  'structural-repair': 'structural repair contractor',
  remodels: 'home remodeling contractor',
};

/** "deck and porch builder" -> "Deck and porch builder", for structured data. */
export const tradeLabel = (trade: string) => trade.charAt(0).toUpperCase() + trade.slice(1);
