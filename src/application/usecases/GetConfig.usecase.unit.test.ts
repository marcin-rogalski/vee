import type { AppConfig } from "@application/ports/AppConfigRepository.port";
import { describe, expect, it, vi } from "vitest";
import GetConfigUseCase from "./GetConfig.usecase";

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

function fakeRepo(config: AppConfig = BASE_CONFIG) {
	return {
		load: vi.fn().mockResolvedValue(config),
		save: vi.fn().mockResolvedValue(undefined),
	};
}

describe("GetConfigUseCase", () => {
	it("returns config with apiKey masked", async () => {
		const useCase = new GetConfigUseCase(fakeRepo());
		const result = await useCase.execute();

		expect(result.models[0]?.apiKey).toBe("***");
		expect(result.systemPrompt).toBe(BASE_CONFIG.systemPrompt);
	});

	it("masks all models", async () => {
		const repo = fakeRepo({
			...BASE_CONFIG,
			models: [
				{
					id: "a",
					type: "openai" as const,
					apiKey: "sk-a",
					baseUrl: "http://a",
					name: "a",
					active: true as const,
				},
				{
					id: "b",
					type: "openai" as const,
					apiKey: "sk-b",
					baseUrl: "http://b",
					name: "b",
				},
			],
		});
		const result = await new GetConfigUseCase(repo).execute();

		expect(result.models.every((m) => m.apiKey === "***")).toBe(true);
	});
});
