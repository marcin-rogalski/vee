export type CacheEntry<T> = {
	value: T
	timestamp: number
}

export function isExpired(entry: { timestamp: number }, ttl: number): boolean {
	return Date.now() - entry.timestamp > ttl
}
