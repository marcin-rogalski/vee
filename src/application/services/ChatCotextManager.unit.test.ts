import { afterEach, describe, expect, it, vi } from "vitest";
import ChatContextManager from "./ChatCotextManager";

vi.mock("tiktoken", () => ({
	get_encoding: () => ({ encode: (s: string) => new Uint32Array(s.length) }),
}));

const config = {
	systemPrompt: "you are helpful",
	server: { port: 3000 },
	mongo: { uri: "mongodb://localhost:27017", database: "vee" },
	tokenLimit: 1000,
	models: [],
};

const repo = {
	create: vi.fn(),
	get: vi.fn().mockResolvedValue({ id: "s1", history: [] }),
	update: vi.fn().mockResolvedValue(undefined),
};

function make() {
	return new ChatContextManager(config, repo);
}

afterEach(() => vi.clearAllMocks());

describe("ChatContextManager", () => {
	it("cache miss: loads session from repository", async () => {
		const mgr = make();
		await mgr.getContext("s1");
		expect(repo.get).toHaveBeenCalledWith("s1");
		mgr.dispose();
	});

	it("cache hit: returns same context instance without hitting repository again", async () => {
		const mgr = make();
		const first = await mgr.getContext("s1");
		const second = await mgr.getContext("s1");
		expect(first).toBe(second);
		expect(repo.get).toHaveBeenCalledTimes(1);
		mgr.dispose();
	});

	it("eviction: expired entries are removed and next call reloads from repository", async () => {
		vi.useFakeTimers();
		const mgr = make();
		await mgr.getContext("s1");
		vi.advanceTimersByTime(16 * 60 * 1000); // past 15-min TTL
		await mgr.getContext("s1");
		expect(repo.get).toHaveBeenCalledTimes(2);
		mgr.dispose();
		vi.useRealTimers();
	});
});
