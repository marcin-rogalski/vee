import type { Collection, Document, WithId } from "mongodb";
import { ObjectId } from "mongodb";

export type MongoDoc<T extends { id: string }> = Omit<T, "id"> & {
	_id: ObjectId;
};

abstract class MongoRepository<
	MongoDocument extends Document & { id: string },
> {
	abstract readonly name: string;
	private _collection: Collection<MongoDoc<MongoDocument>> | undefined;

	initialize(collection: Collection<MongoDoc<MongoDocument>>): void {
		this._collection = collection;
	}

	get collection(): Collection<MongoDoc<MongoDocument>> {
		if (!this._collection) {
			throw new Error(
				`Repository "${this.name}" used before initialization — call MongoDatabase.connect() first`,
			);
		}

		return this._collection;
	}

	protected generateId(): string {
		return new ObjectId().toHexString();
	}

	static toMongoId<T extends Document & { id: string }>(
		entity: T | { id: string },
	): MongoDoc<T> {
		const { id, ...rest } = entity as { id: string } & Record<string, unknown>;

		return { ...rest, _id: new ObjectId(id) } as unknown as MongoDoc<T>;
	}

	static fromMongoId<T extends Document & { id: string }>(
		doc: WithId<MongoDoc<T>>,
	): T {
		const { _id, ...rest } = doc as Record<string, unknown>;

		return { id: (_id as ObjectId).toHexString(), ...rest } as unknown as T;
	}
}

export default MongoRepository;
