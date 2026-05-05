import Health from "./infrastructure/http/adapters/Health.endpoint";
import Server from "./infrastructure/http/server";

async function start() {
	const server = new Server();

	// todo: implement ChatSessionRepositoryPort, ConfigRepositoryPort, ChatToolManagerPort
	// todo: wire OpenAiModelAdapter + ChatContextManager + UserMessageEndpoint

	server.register(Health);

	await server.start();
}

start().catch((error) => {
	console.error("Startup error:", error);
	process.exit(1);
});
