// Session-lifetime cache for GET JSON responses, keyed by full URL.
// ponytail: no TTL or invalidation — fine while the device is offline; add a TTL if live data returns.
const cache = new Map<string, any>();

export async function cachedFetchJson(url: string): Promise<any> {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
}
