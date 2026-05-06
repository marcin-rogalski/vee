import type AppConfigRepositoryPort from "@application/ports/AppConfigRepository.port";
import type { AppConfig } from "@application/ports/AppConfigRepository.port";

class GetConfigUseCase {
	constructor(private readonly configRepo: AppConfigRepositoryPort) {}

	async execute(): Promise<AppConfig> {
		const config = await this.configRepo.load();

		return {
			...config,
			models: config.models.map((m) => ({ ...m, apiKey: "***" })),
		};
	}
}

export default GetConfigUseCase;
