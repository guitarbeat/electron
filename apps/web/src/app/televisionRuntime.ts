const TELEVISION_UA =
  /ElectronTV|\bAFT[A-Z0-9]{2,}\b|Silk|Kindle|Fire\s?TV|AmazonWebAppPlatform|smart-?tv|googletv|apple\s?tv|hbbtv|tizen|webos/i;

/** True for the Fire TV shell, a television browser, or an explicit `?tv=1` preview. */
export function isTelevisionRuntime(userAgent: string, search = ""): boolean {
  const query = search.startsWith("?") ? search.slice(1) : search;
  if (new URLSearchParams(query).get("tv") === "1") return true;
  return TELEVISION_UA.test(userAgent);
}
