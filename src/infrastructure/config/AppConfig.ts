import { z } from "zod";

const openAiModelSchema = z.object({
	type: z.literal("openai").default("openai"),
	apiKey: z.string({ message: "OPENAI_API_KEY is required" }),
	baseUrl: z.string().default("http://localhost:1234/v1"),
	name: z.string().default("local-model"),
});

export const appConfigSchema = z.object({
	systemPrompt: z.string().default("You are a helpful assistant."),
	server: z
		.object({
			port: z.coerce.number().default(3000),
		})
		.default({ port: 3000 }),
	mongo: z
		.object({
			uri: z.string().default("mongodb://localhost:27017"),
			database: z.string().default("vee"),
		})
		.default({ uri: "mongodb://localhost:27017", database: "vee" }),
	tokenLimit: z.coerce.number().default(4096),
	model: openAiModelSchema,
});

type AppConfig = z.infer<typeof appConfigSchema>;

export default AppConfig;
