import type ChatSession from "@application/dto/ChatSession";
import type SessionRepositoryPort from "@application/ports/ChatSessionRepository.port";
import MongoRepository from "./MongoRepository";

class MongoSessionRepository
	extends MongoRepository<ChatSession>
	implements SessionRepositoryPort
{
	readonly name = "sessions";

	async upsert(session: {
		id?: string;
		history: ChatSession["history"];
	}): Promise<ChatSession> {
		const id = session.id ?? crypto.randomUUID();
		await this.collection.replaceOne(
			{ _id: id },
			{ history: session.history },
			{ upsert: true },
		);

		return { id, history: session.history };
	}

	async get(id: string): Promise<ChatSession | null> {
		const doc = await this.collection.findOne({ _id: id });

		if (!doc) {
			return null;
		}

		return MongoRepository.fromMongoId(doc);
	}

	async list(): Promise<string[]> {
		return this.collection.distinct("_id") as Promise<string[]>;
	}
}

export default MongoSessionRepository;
