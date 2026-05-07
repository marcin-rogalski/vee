import ChatContextManager from "./application/services/ChatCotextManager";
import GetConfigUseCase from "./application/usecases/GetConfig.usecase";
import UpdateConfigUseCase from "./application/usecases/UpdateConfig.usecase";
import FSConfigRepository from "./infrastructure/config/FSConfigRepository.adapter";
import NodeFileSystem from "./infrastructure/fs/NodeFileSystem.adapter";
import {
	GetConfigEndpoint,
	PatchConfigEndpoint,
} from "./infrastructure/http/adapters/Config.endpoint";
import {
	GetSessionsEndpoint,
	PostSessionsEndpoint,
} from "./infrastructure/http/adapters/Sessions.endpoint";
import HealthEndpoint from "./infrastructure/http/adapters/Health.endpoint";
import UserMessageEndpoint from "./infrastructure/http/adapters/UserMessage.endpoint";
import Server from "./infrastructure/http/server";
import OpenAiModelAdapter from "./infrastructure/llm/OpenAiModel.adapter";
import ConsoleLoggerAdapter from "./infrastructure/logging/ConsoleLogger.adapter";
import MongoDatabase from "./infrastructure/mongodb/MongoDatabase";
import MongoSessionRepository from "./infrastructure/mongodb/MongoSessionRepository.adapter";
import LocalToolManager from "./infrastructure/tools/LocalToolManager.adapter";
import ReadFileTool from "./infrastructure/tools/ReadFile.adapter";
import WriteFileTool from "./infrastructure/tools/WriteFile.adapter";

async function start() {
	const fileSystem = new NodeFileSystem();
	const configRepository = new FSConfigRepository(fileSystem);
	const config = await configRepository.load();

	// driven adapters
	const db = new MongoDatabase(config.mongo.uri, config.mongo.database);
	const sessionRepo = new MongoSessionRepository();
	const activeModelConfig = config.models.find((m) => m.active);
	const model =
		activeModelConfig?.type === "openai"
			? new OpenAiModelAdapter(
					activeModelConfig.baseUrl,
					activeModelConfig.apiKey,
					activeModelConfig.name,
				)
			: null;

	// services
	const contextManager = new ChatContextManager(config, sessionRepo);
	const toolManager = new LocalToolManager();

	// driving adapters
	const logger = new ConsoleLoggerAdapter();
	const server = new Server(config.server.port, logger);
	const healthEndpoint = new HealthEndpoint();
	const userMessageEndpoint = new UserMessageEndpoint(
		contextManager,
		toolManager,
		logger,
		model,
	);
	const getConfigEndpoint = new GetConfigEndpoint(
		new GetConfigUseCase(configRepository),
	);
	const patchConfigEndpoint = new PatchConfigEndpoint(
		new UpdateConfigUseCase(configRepository),
	);
	const getSessionsEndpoint = new GetSessionsEndpoint(sessionRepo);
	const postSessionsEndpoint = new PostSessionsEndpoint(sessionRepo);

	// registrations
	db.register(sessionRepo);

	toolManager.register(
		new ReadFileTool(fileSystem),
		new WriteFileTool(fileSystem),
	);

	server.register(
		healthEndpoint,
		userMessageEndpoint,
		getConfigEndpoint,
		patchConfigEndpoint,
		getSessionsEndpoint,
		postSessionsEndpoint,
	);

	// start
	await db.connect();
	await server.start();

	logger.info("app.start", {
		port: config.server.port,
		mongoUri: config.mongo.uri.replace(/(\/\/)[^@]*@/, "$1***@"),
		mongoDatabase: config.mongo.database,
		tokenLimit: config.tokenLimit,
		systemPrompt: config.systemPrompt
			? `${config.systemPrompt.slice(0, 60)}…`
			: null,
		models: config.models.map((m) => ({
			id: m.id,
			type: m.type,
			name: m.name ?? null,
			active: m.active ?? false,
		})),
		activeModel: activeModelConfig
			? `${activeModelConfig.id} (${activeModelConfig.name ?? activeModelConfig.type})`
			: "none",
	});
}

start().catch((error) => {
	console.error("Startup error:", error);
	process.exit(1);
});
