import { describe, expect, it, vi } from "vitest";
import UpdateConfigUseCase from "./UpdateConfig.usecase";

const BASE_CONFIG = {
	systemPrompt: "You are a helpful assistant.",
	server: { port: 3000 },
	mongo: { uri: "mongodb://localhost:27017", database: "vee" },
	tokenLimit: 4096,
	models: [
		{
			id: "local",
			type: "openai" as const,
			apiKey: "sk-real-key",
			baseUrl: "http://localhost:1234/v1",
			name: "local-model",
			active: true as const,
		},
	],
};

function fakeRepo(config = BASE_CONFIG) {
	return {
		load: vi.fn().mockResolvedValue(config),
		save: vi.fn().mockResolvedValue(undefined),
	};
}

describe("UpdateConfigUseCase", () => {
	it("deep merges patch and saves", async () => {
		const repo = fakeRepo();
		const useCase = new UpdateConfigUseCase(repo);

		await useCase.execute({ systemPrompt: "new prompt" });

		expect(repo.save).toHaveBeenCalledWith(
			expect.objectContaining({ systemPrompt: "new prompt", tokenLimit: 4096 }),
		);
	});

	it("merges nested objects without overwriting sibling fields", async () => {
		const repo = fakeRepo();
		const useCase = new UpdateConfigUseCase(repo);

		await useCase.execute({ server: { port: 9000 } });

		expect(repo.save).toHaveBeenCalledWith(
			expect.objectContaining({ server: { port: 9000 } }),
		);
	});

	it("replaces models array entirely when provided", async () => {
		const repo = fakeRepo();
		const useCase = new UpdateConfigUseCase(repo);
		const newModels = [
			{
				id: "x",
				type: "openai",
				apiKey: "sk-x",
				baseUrl: "http://x",
				name: "x",
			},
		];

		await useCase.execute({ models: newModels });

		const saved = repo.save.mock.calls[0]?.[0];
		expect(saved.models).toHaveLength(1);
		expect(saved.models[0].id).toBe("x");
	});

	it("throws when two models are active", async () => {
		const repo = fakeRepo();
		const useCase = new UpdateConfigUseCase(repo);

		await expect(
			useCase.execute({
				models: [
					{
						id: "a",
						type: "openai",
						apiKey: "sk-a",
						baseUrl: "http://a",
						name: "a",
						active: true,
					},
					{
						id: "b",
						type: "openai",
						apiKey: "sk-b",
						baseUrl: "http://b",
						name: "b",
						active: true,
					},
				],
			}),
		).rejects.toThrow("At most one model can be active");
	});

	it("returns config with apiKey masked", async () => {
		const repo = fakeRepo();
		const result = await new UpdateConfigUseCase(repo).execute({
			systemPrompt: "x",
		});

		expect(result.models[0]?.apiKey).toBe("***");
	});
});
