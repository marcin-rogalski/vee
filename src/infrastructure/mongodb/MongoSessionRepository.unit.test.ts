import { describe, expect, it, vi } from "vitest";
import MongoSessionRepository from "./MongoSessionRepository.adapter";

function makeRepo() {
	const repo = new MongoSessionRepository();
	const col = {
		replaceOne: vi.fn(),
		findOne: vi.fn(),
		distinct: vi.fn(),
	};
	// biome-ignore lint/suspicious/noExplicitAny: col is a partial mock
	repo.initialize(col as any);
	return { repo, col };
}

describe("MongoSessionRepository", () => {
	it("upsert with id stores document with that id", async () => {
		const { repo, col } = makeRepo();
		const uuid = crypto.randomUUID();
		col.replaceOne.mockResolvedValue({ acknowledged: true });

		const result = await repo.upsert({ id: uuid, history: [] });

		expect(col.replaceOne).toHaveBeenCalledWith(
			{ _id: uuid },
			{ history: [] },
			{ upsert: true },
		);
		expect(result.id).toBe(uuid);
		expect(result.history).toEqual([]);
	});

	it("upsert without id auto-assigns uuid", async () => {
		const { repo, col } = makeRepo();
		col.replaceOne.mockResolvedValue({ acknowledged: true });

		const result = await repo.upsert({ history: [] });

		expect(typeof result.id).toBe("string");
		expect(result.id.length).toBeGreaterThan(0);
		expect(col.replaceOne).toHaveBeenCalledTimes(1);
	});

	it("get returns session when found", async () => {
		const { repo, col } = makeRepo();
		const uuid = crypto.randomUUID();
		col.findOne.mockResolvedValue({
			_id: uuid,
			history: [{ author: "user", content: "hi", ts: 1 }],
		});

		const session = await repo.get(uuid);

		if (!session) throw new Error("expected session to be non-null");
		expect(session.id).toBe(uuid);
		expect(session.history).toHaveLength(1);
	});

	it("get returns null when not found", async () => {
		const { repo, col } = makeRepo();
		col.findOne.mockResolvedValue(null);

		const result = await repo.get(crypto.randomUUID());

		expect(result).toBeNull();
	});

	it("list returns array of ids", async () => {
		const { repo, col } = makeRepo();
		const uuid1 = crypto.randomUUID();
		const uuid2 = crypto.randomUUID();
		col.distinct.mockResolvedValue([uuid1, uuid2]);

		const result = await repo.list();

		expect(result).toEqual([uuid1, uuid2]);
	});
});
