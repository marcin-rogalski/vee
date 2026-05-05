import express from "express";
import type { AnyEndpoint } from "./types";

export default class Server {
	private express = express();
	private endpoints: AnyEndpoint[] = [];

	constructor(readonly port: number = 3000) {
		this.express.use(express.json());
	}

	register(endpoint: AnyEndpoint) {
		this.endpoints.push(endpoint);
		const expressPath = endpoint.path.replace(/\{(\w+)(?::\w+)?\}/g, ":$1");
		this.express[endpoint.method.toLowerCase() as keyof typeof this.express](
			expressPath,
			...endpoint.toHandlers(),
		);
	}

	async start() {
		this.express.listen(this.port, () => {
			console.log(`Server is running on port ${this.port}`);
		});
	}
}
