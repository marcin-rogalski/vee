import type appConfigSchema from "@application/schemas/AppConfig.schema";
import type z from "zod";

export type AppConfig = z.infer<typeof appConfigSchema>;

interface AppConfigRepositoryPort {
	load(): Promise<AppConfig>;
	save(config: AppConfig): Promise<void>;
}

export default AppConfigRepositoryPort;
