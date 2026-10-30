export const CAT_FALLBACK_POSTERS = [
  "https://cataas.com/cat?width=300&height=450",
  "https://cataas.com/cat/cute?width=300&height=450",
];

export const getRandomCatPoster = (): string =>
  CAT_FALLBACK_POSTERS[Math.floor(Math.random() * CAT_FALLBACK_POSTERS.length)];
