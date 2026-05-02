import health from "./infrastruture/http/adapters/health";
import Server from "./infrastruture/http/server";

class Main {
	constructor() {
		this.start().catch((error) => {
			console.error("An error occurred during startup:", error);
			process.exit(1);
		});
	}

	async start() {
		const server = new Server();

		server.register(health);

		await server.start();
	}
}

export default new Main().start();
