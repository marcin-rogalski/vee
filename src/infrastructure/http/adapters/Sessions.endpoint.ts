import type SessionRepositoryPort from "@application/ports/ChatSessionRepository.port";
import Zod from "zod";
import Endpoint from "../server/endpoint";

const getSessionsResponseSchema = Zod.object({
	sessions: Zod.array(Zod.string()),
});

const postSessionsResponseSchema = Zod.object({
	id: Zod.string(),
});

export class GetSessionsEndpoint extends Endpoint.typed("GET", "/sessions", {
	response: getSessionsResponseSchema,
}) {
	constructor(private readonly sessionRepository: SessionRepositoryPort) {
		super();
	}

	async handle() {
		const sessions = await this.sessionRepository.list();
		return { sessions };
	}
}

export class PostSessionsEndpoint extends Endpoint.typed("POST", "/sessions", {
	response: postSessionsResponseSchema,
}) {
	constructor(private readonly sessionRepository: SessionRepositoryPort) {
		super();
	}

	async handle() {
		const session = await this.sessionRepository.upsert({ history: [] });
		return { id: session.id };
	}
}
