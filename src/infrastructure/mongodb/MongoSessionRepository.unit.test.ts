import { ObjectId } from "mongodb";
import { describe, expect, it, vi } from "vitest";
import MongoSessionRepository from "./MongoSessionRepository.adapter";

function makeRepo() {
	const repo = new MongoSessionRepository();
	const col = {
		insertOne: vi.fn(),
		findOne: vi.fn(),
		updateOne: vi.fn(),
	};
	// biome-ignore lint/suspicious/noExplicitAny: col is a partial mock
	repo.initialize(col as any);
	return { repo, col };
}

describe("MongoSessionRepository", () => {
	it("create returns inserted id as string", async () => {
		const { repo, col } = makeRepo();
		const hexId = new ObjectId().toHexString();
		col.insertOne.mockResolvedValue({});
		// biome-ignore lint/suspicious/noExplicitAny: generateId is protected
		vi.spyOn(repo as any, "generateId").mockReturnValue(hexId);

		const result = await repo.create();

		expect(result).toBe(hexId);
		expect(col.insertOne).toHaveBeenCalledWith(
			expect.objectContaining({ _id: expect.any(ObjectId), history: [] }),
		);
	});

	it("get maps document to ChatSession", async () => {
		const { repo, col } = makeRepo();
		const id = new ObjectId();
		col.findOne.mockResolvedValue({
			_id: id,
			history: [{ author: "user", content: "hi", ts: 1 }],
		});

		const session = await repo.get(id.toString());

		expect(session.id).toBe(id.toString());
		expect(session.history).toHaveLength(1);
	});

	it("get throws when document not found", async () => {
		const { repo, col } = makeRepo();
		col.findOne.mockResolvedValue(null);

		await expect(repo.get(new ObjectId().toString())).rejects.toThrow(
			"Session not found",
		);
	});

	it("update calls $push with the given entry", async () => {
		const { repo, col } = makeRepo();
		col.updateOne.mockResolvedValue({});
		const id = new ObjectId();
		const entry = { author: "user" as const, content: "hello", ts: Date.now() };

		await repo.update(id.toString(), entry);

		expect(col.updateOne).toHaveBeenCalledWith(
			{ _id: expect.any(ObjectId) },
			{ $push: { history: entry } },
		);
	});
});
