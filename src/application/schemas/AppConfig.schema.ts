import { z } from "zod";

export const openAiModelSchema = z.object({
	id: z.string(),
	type: z.literal("openai"),
	apiKey: z.string(),
	baseUrl: z.string().default("http://localhost:1234/v1"),
	name: z.string().default("local-model"),
	active: z.literal(true).optional(),
});

export const modelSchema = z.discriminatedUnion("type", [openAiModelSchema]);

export const serverSchema = z
	.object({ port: z.coerce.number().default(3000) })
	.default({ port: 3000 });

export const mongoSchema = z
	.object({
		uri: z.string().default("mongodb://localhost:27017"),
		database: z.string().default("vee"),
	})
	.default({ uri: "mongodb://localhost:27017", database: "vee" });
// todo: fix duplcate default values in appConfigSchema and mongoSchema

export const systemPromptSchema = z
	.string()
	.default("You are a helpful assistant.");

export const appConfigBaseSchema = z.object({
	systemPrompt: systemPromptSchema,
	server: serverSchema,
	mongo: mongoSchema,
	tokenLimit: z.coerce.number().default(4096),
	models: z.array(modelSchema).default([]),
});

const appConfigSchema = appConfigBaseSchema.refine(
	(c) => c.models.filter((m) => m.active).length <= 1,
	{ message: "At most one model can be active" },
);

export default appConfigSchema;
