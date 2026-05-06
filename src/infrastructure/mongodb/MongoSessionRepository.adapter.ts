import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatSession from "@application/dto/ChatSession";
import type SessionRepositoryPort from "@application/ports/ChatSessionRepository.port";
import MongoRepository from "./MongoRepository";

class MongoSessionRepository
	extends MongoRepository<ChatSession>
	implements SessionRepositoryPort
{
	readonly name = "sessions";

	async create(): Promise<string> {
		const session: ChatSession = { id: this.generateId(), history: [] };

		await this.collection.insertOne(MongoRepository.toMongoId(session));

		return session.id;
	}

	async get(id: string): Promise<ChatSession> {
		const doc = await this.collection.findOne(
			MongoRepository.toMongoId({ id }),
		);

		if (!doc) {
			throw new Error(`Session not found: ${id}`);
		}

		return MongoRepository.fromMongoId(doc);
	}

	async update(sessionId: string, entry: ChatEntry): Promise<void> {
		await this.collection.updateOne(
			MongoRepository.toMongoId({ id: sessionId }),
			{ $push: { history: entry } },
		);
	}
}

export default MongoSessionRepository;
