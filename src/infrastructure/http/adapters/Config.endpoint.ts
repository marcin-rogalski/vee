import appConfigSchema, { modelSchema } from "@application/schemas/AppConfig.schema";
import type GetConfigUseCase from "@application/usecases/GetConfig.usecase";
import type UpdateConfigUseCase from "@application/usecases/UpdateConfig.usecase";
import { z } from "zod";
import Endpoint from "../server/endpoint";

const configPatchSchema = z.object({
	systemPrompt: z.string().optional(),
	server: z.object({ port: z.coerce.number() }).optional(),
	mongo: z.object({ uri: z.string(), database: z.string() }).partial().optional(),
	tokenLimit: z.coerce.number().optional(),
	models: z.array(modelSchema).optional(),
});

export class GetConfigEndpoint extends Endpoint.typed("GET", "/config", {
	response: appConfigSchema,
}) {
	constructor(private readonly useCase: GetConfigUseCase) {
		super();
	}

	handle() {
		return this.useCase.execute();
	}
}

export class PatchConfigEndpoint extends Endpoint.typed("PATCH", "/config", {
	body: configPatchSchema,
	response: appConfigSchema,
}) {
	constructor(private readonly useCase: UpdateConfigUseCase) {
		super();
	}

	handle(
		_params: Record<never, never>,
		body: ReturnType<typeof configPatchSchema.parse>,
	) {
		return this.useCase.execute(body as Record<string, unknown>);
	}
}
