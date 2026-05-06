import * as os from "node:os";
import * as path from "node:path";
import type FileSystemPort from "@application/ports/FileSystem.port";
import { type default as AppConfig, appConfigSchema } from "./AppConfig";

const CONFIG_PATH = path.join(os.homedir(), ".vee", "config.json");

class FSConfigRepository {
	constructor(private readonly fs: FileSystemPort) {}

	async load(): Promise<AppConfig> {
		const fileContent = await this.readConfigFile();

		if (fileContent !== null) {
			return appConfigSchema.parse(fileContent);
		}

		const config = this.fromEnv();
		await this.writeConfig(config);

		return config;
	}

	private fromEnv(): AppConfig {
		return appConfigSchema.parse({
			systemPrompt: process.env.SYSTEM_PROMPT,
			server: { port: process.env.PORT },
			mongo: {
				uri: process.env.MONGO_URI,
				database: process.env.MONGO_DB,
			},
			tokenLimit: process.env.TOKEN_LIMIT,
			model: {
				apiKey: process.env.OPENAI_API_KEY,
				baseUrl: process.env.OPENAI_BASE_URL,
				name: process.env.OPENAI_MODEL,
			},
		});
	}

	private async readConfigFile(): Promise<unknown> {
		try {
			const raw = await this.fs.readFile(CONFIG_PATH);
			return JSON.parse(raw);
		} catch {
			return null;
		}
	}

	private async writeConfig(config: AppConfig): Promise<void> {
		await this.fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
		await this.fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
	}
}

export default FSConfigRepository;
