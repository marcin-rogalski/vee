import type ChatEntry from "@application/dto/ChatEntry.dto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RollingWindowContext from "./RollingWindowContext";

vi.mock("tiktoken", () => ({
	get_encoding: () => ({ encode: (s: string) => new Uint32Array(s.length) }),
}));

const repo = {
	create: vi.fn(),
	get: vi.fn(),
	update: vi.fn().mockResolvedValue(undefined),
};

function make(tokenLimit: number, history: ChatEntry[] = []) {
	return new RollingWindowContext("s1", "sys", history, tokenLimit, repo);
}

beforeEach(() => vi.clearAllMocks());

describe("RollingWindowContext", () => {
	it("entries contain only system before startTurn", () => {
		expect(make(100).entries).toEqual([{ author: "system", content: "sys" }]);
	});

	it("startTurn appends user entry", () => {
		const ctx = make(100);
		ctx.startTurn("hi");
		const last = ctx.entries.at(-1);
		expect(last).toMatchObject({ author: "user", content: "hi" });
	});

	it("history within budget is fully included", () => {
		const history: ChatEntry[] = [
			{ author: "user", content: "hello", ts: 0 }, // 5 tokens
			{ author: "assistant", content: "world", ts: 0 }, // 5 tokens
		];
		// sys(3) + user(2) = 5 pinned; budget = 25; history(10) fits
		const ctx = make(30, history);
		ctx.startTurn("hi");
		expect(ctx.entries).toContainEqual(
			expect.objectContaining({ content: "hello" }),
		);
		expect(ctx.entries).toContainEqual(
			expect.objectContaining({ content: "world" }),
		);
	});

	it("oldest history is dropped when over budget", () => {
		const history: ChatEntry[] = [
			{ author: "user", content: "hello", ts: 0 }, // 5 tokens — oldest
			{ author: "assistant", content: "world", ts: 0 }, // 5 tokens — newest
		];
		// sys(3) + user(2) = 5 pinned; budget = 5; only newest history entry fits
		const ctx = make(10, history);
		ctx.startTurn("hi");
		expect(ctx.entries).toContainEqual(
			expect.objectContaining({ content: "world" }),
		);
		expect(ctx.entries).not.toContainEqual(
			expect.objectContaining({ content: "hello" }),
		);
	});

	it("push adds entry to currentTurn and persists", async () => {
		const ctx = make(100);
		ctx.startTurn("hi");
		const entry: ChatEntry = { author: "assistant", content: "hey", ts: 0 };
		await ctx.push(entry);
		expect(ctx.entries).toContainEqual(entry);
		expect(repo.update).toHaveBeenCalledWith("s1", entry);
	});

	it("commitTurn moves user and currentTurn into history for next turn", async () => {
		const ctx = make(200);
		ctx.startTurn("hi");
		await ctx.push({ author: "assistant", content: "hey", ts: 0 });
		ctx.commitTurn();
		ctx.startTurn("next");
		expect(ctx.entries).toContainEqual(
			expect.objectContaining({ content: "hey" }),
		);
		expect(ctx.entries).toContainEqual(
			expect.objectContaining({ content: "hi" }),
		);
	});
});
