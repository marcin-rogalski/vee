import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FSConfigRepository from "./FSConfigRepository.adapter";

const ACTIVE_MODEL = {
	id: "gpt-4o",
	type: "openai" as const,
	apiKey: "sk-file-key",
	baseUrl: "http://localhost:1234/v1",
	name: "gpt-4o",
	active: true as const,
};

const VALID_CONFIG = {
	systemPrompt: "custom prompt",
	server: { port: 8080 },
	mongo: { uri: "mongodb://mongo:27017", database: "mydb" },
	tokenLimit: 8192,
	models: [ACTIVE_MODEL],
};

function makeFs(fileContent?: string) {
	return {
		readFile: vi.fn<() => Promise<string>>(
			fileContent
				? () => Promise.resolve(fileContent)
				: () => Promise.reject(new Error("ENOENT")),
		),
		writeFile: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
		mkdir: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
	};
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
	delete process.env.OPENAI_API_KEY;
	delete process.env.OPENAI_BASE_URL;
	delete process.env.OPENAI_MODEL;
	delete process.env.SYSTEM_PROMPT;
	delete process.env.PORT;
	delete process.env.MONGO_URI;
	delete process.env.MONGO_DB;
	delete process.env.TOKEN_LIMIT;
});

describe("FSConfigRepository.load", () => {
	it("returns config from file when complete", async () => {
		const repo = new FSConfigRepository(makeFs(JSON.stringify(VALID_CONFIG)));
		const config = await repo.load();
		expect(config).toEqual(VALID_CONFIG);
	});

	it("fills missing fields from env and writes file back", async () => {
		process.env.OPENAI_API_KEY = "sk-env-key";
		process.env.SYSTEM_PROMPT = "env prompt";
		const fs = makeFs();
		const repo = new FSConfigRepository(fs);

		const config = await repo.load();

		const [model] = config.models;
		expect(model?.apiKey).toBe("sk-env-key");
		expect(model?.active).toBe(true);
		expect(config.systemPrompt).toBe("env prompt");
		expect(config.mongo.uri).toBe("mongodb://localhost:27017");
		expect(config.tokenLimit).toBe(4096);
		expect(fs.writeFile).toHaveBeenCalledOnce();
	});

	it("uses defaults when neither file nor env present", async () => {
		const config = await new FSConfigRepository(makeFs()).load();

		expect(config.systemPrompt).toBe("You are a helpful assistant.");
		expect(config.server.port).toBe(3000);
		expect(config.mongo).toEqual({
			uri: "mongodb://localhost:27017",
			database: "vee",
		});
		expect(config.tokenLimit).toBe(4096);
		expect(config.models).toEqual([]);
	});

	it("produces an active model from env when OPENAI_API_KEY is set", async () => {
		process.env.OPENAI_API_KEY = "sk-required";
		const config = await new FSConfigRepository(makeFs()).load();

		expect(config.models).toHaveLength(1);
		expect(config.models[0]).toMatchObject({
			active: true,
			apiKey: "sk-required",
		});
	});

	it("throws when more than one model is active", async () => {
		const twoActive = {
			...VALID_CONFIG,
			models: [ACTIVE_MODEL, { ...ACTIVE_MODEL, id: "other" }],
		};
		await expect(
			new FSConfigRepository(makeFs(JSON.stringify(twoActive))).load(),
		).rejects.toThrow("At most one model can be active");
	});
});
