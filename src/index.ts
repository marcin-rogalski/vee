import ChatContextManager from "./application/services/ChatCotextManager";
import FSConfigRepository from "./infrastructure/config/FSConfigRepository.adapter";
import NodeFileSystem from "./infrastructure/fs/NodeFileSystem.adapter";
import HealthEndpoint from "./infrastructure/http/adapters/Health.endpoint";
import UserMessageEndpoint from "./infrastructure/http/adapters/UserMessage.endpoint";
import Server from "./infrastructure/http/server";
import OpenAiModelAdapter from "./infrastructure/llm/OpenAiModel.adapter";
import MongoDatabase from "./infrastructure/mongodb/MongoDatabase";
import MongoSessionRepository from "./infrastructure/mongodb/MongoSessionRepository.adapter";
import LocalToolManager from "./infrastructure/tools/LocalToolManager.adapter";
import ReadFileTool from "./infrastructure/tools/ReadFile.tool";
import WriteFileTool from "./infrastructure/tools/WriteFile.tool";

async function start() {
	const fileSystem = new NodeFileSystem();
	const config = await new FSConfigRepository(fileSystem).load();

	// driven adapters
	const db = new MongoDatabase(config.mongo.uri, config.mongo.database);
	const configRepo = { systemPrompt: config.systemPrompt };
	const sessionRepo = new MongoSessionRepository();
	const model = new OpenAiModelAdapter(
		config.model.baseUrl,
		config.model.apiKey,
		config.model.name,
	);

	// services
	const contextManager = new ChatContextManager(
		configRepo,
		sessionRepo,
		config.tokenLimit,
	);
	const toolManager = new LocalToolManager();

	// driving adapters
	const server = new Server(config.server.port);
	const healthEndpoint = new HealthEndpoint();
	const userMessageEndpoint = new UserMessageEndpoint(
		contextManager,
		toolManager,
		model,
	);

	// registrations
	db.register(sessionRepo);

	toolManager.register(
		new ReadFileTool(fileSystem),
		new WriteFileTool(fileSystem),
	);

	server.register(healthEndpoint, userMessageEndpoint);

	// start
	await db.connect();
	await server.start();
}

start().catch((error) => {
	console.error("Startup error:", error);
	process.exit(1);
});
