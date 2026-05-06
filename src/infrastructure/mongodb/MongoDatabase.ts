import { type Db, type Document, MongoClient } from "mongodb";
import type MongoRepository from "./MongoRepository";

class MongoDatabase {
	private client: MongoClient | undefined;
	private db: Db | undefined;
	// biome-ignore lint/suspicious/noExplicitAny: heterogeneous repos; each subclass types its own document
	private readonly repos: MongoRepository<any>[] = [];

	constructor(
		private readonly uri: string,
		private readonly dbName: string,
	) {}

	register<T extends Document & { id: string }>(
		...repos: MongoRepository<T>[]
	): this {
		// biome-ignore lint/suspicious/noExplicitAny: Collection<T> is invariant; safe because only name and initialize are used
		this.repos.push(...(repos as unknown as MongoRepository<any>[]));
		return this;
	}

	async connect(): Promise<void> {
		this.client ??= await MongoClient.connect(this.uri);
		this.db ??= this.client.db(this.dbName);

		for (const repo of this.repos) {
			repo.initialize(this.db.collection(repo.name));
		}

		process.on("SIGINT", this.disconnect.bind(this));
		process.on("SIGTERM", this.disconnect.bind(this));
	}

	async disconnect(): Promise<void> {
		await this.client?.close();

		this.client = undefined;
		this.db = undefined;
	}

	async ping(): Promise<void> {
		if (!this.db) {
			throw new Error("Database not connected");
		}

		await this.db.admin().ping();
	}
}

export default MongoDatabase;
