import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FSConfigRepository from "./FSConfigRepository.adapter";

const VALID_CONFIG = {
	systemPrompt: "custom prompt",
	server: { port: 8080 },
	mongo: { uri: "mongodb://mongo:27017", database: "mydb" },
	tokenLimit: 8192,
	model: {
		type: "openai" as const,
		apiKey: "sk-file-key",
		baseUrl: "http://localhost:1234/v1",
		name: "gpt-4o",
	},
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

		expect(config.model.apiKey).toBe("sk-env-key");
		expect(config.systemPrompt).toBe("env prompt");
		expect(config.mongo.uri).toBe("mongodb://localhost:27017");
		expect(config.tokenLimit).toBe(4096);
		expect(fs.writeFile).toHaveBeenCalledOnce();
	});

	it("uses defaults when neither file nor env present (except apiKey)", async () => {
		process.env.OPENAI_API_KEY = "sk-required";
		const config = await new FSConfigRepository(makeFs()).load();

		expect(config.systemPrompt).toBe("You are a helpful assistant.");
		expect(config.server.port).toBe(3000);
		expect(config.mongo).toEqual({ uri: "mongodb://localhost:27017", database: "vee" });
		expect(config.tokenLimit).toBe(4096);
		expect(config.model.baseUrl).toBe("http://localhost:1234/v1");
		expect(config.model.name).toBe("local-model");
	});

	it("throws when openai.apiKey absent from both file and env", async () => {
		await expect(new FSConfigRepository(makeFs()).load()).rejects.toThrow(
			"OPENAI_API_KEY is required",
		);
	});
});
