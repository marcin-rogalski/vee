import type AppConfigRepositoryPort from "@application/ports/AppConfigRepository.port";
import type { AppConfig } from "@application/ports/AppConfigRepository.port";
import appConfigSchema from "@application/schemas/AppConfig.schema";

class UpdateConfigUseCase {
	constructor(private readonly configRepo: AppConfigRepositoryPort) {}

	async execute(patch: Record<string, unknown>): Promise<AppConfig> {
		const current = await this.configRepo.load();
		const merged = deepMerge(current as Record<string, unknown>, patch);
		const config = appConfigSchema.parse(merged);

		await this.configRepo.save(config);

		return {
			...config,
			models: config.models.map((m) => ({ ...m, apiKey: "***" })),
		};
	}
}

export default UpdateConfigUseCase;

function deepMerge(
	base: Record<string, unknown>,
	patch: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...base };
	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) {
			continue;
		}
		const baseVal = base[key];
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			baseVal !== null &&
			typeof baseVal === "object" &&
			!Array.isArray(baseVal)
		) {
			result[key] = deepMerge(
				baseVal as Record<string, unknown>,
				value as Record<string, unknown>,
			);
		} else {
			result[key] = value;
		}
	}
	return result;
}
