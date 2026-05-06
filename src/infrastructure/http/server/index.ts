import type { Server as HttpServer } from "node:http";
import express from "express";
import type { AnyEndpoint } from "./types";

export default class Server {
	private express = express();
	private httpServer: HttpServer | undefined;

	constructor(readonly port: number = 3000) {
		this.express.use(express.json());
	}

	register(...endpoints: AnyEndpoint[]): this {
		for (const endpoint of endpoints) {
			const expressPath = endpoint.path.replace(/\{(\w+)(?::\w+)?\}/g, ":$1");
			this.express[endpoint.method.toLowerCase() as keyof typeof this.express](
				expressPath,
				...endpoint.toHandlers(),
			);
		}
		return this;
	}

	async start() {
		this.httpServer = this.express.listen(this.port, () => {
			console.log(`Server is running on port ${this.port}`);
		});

		process.on("SIGINT", this.stop.bind(this));
		process.on("SIGTERM", this.stop.bind(this));
	}

	private async stop() {
		this.httpServer?.close();
	}
}
