import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type LoggerPort from '@application/ports/Logger.port'

type NotFoundCtor = new (entity: string, id: string) => Error

abstract class JsonFileRepository<T, ListResult = Pick<T, keyof T>> {
	constructor(
		protected readonly filePath: string,
		protected readonly entityName: string,
		protected readonly NotFoundError: NotFoundCtor,
		protected readonly logger: LoggerPort,
	) {}

	protected async read(): Promise<T[]> {
		try {
			const raw = await readFile(this.filePath, 'utf-8')
			const items: unknown[] = JSON.parse(raw)
			return items.filter((item) => {
				if (this.validateItem(item)) {
					return true
				}
				this.logger.warn(
					`[${this.entityName}] Invalid item filtered from ${this.filePath}:`,
					{ item },
				)
				return false
			}) as T[]
		} catch (error) {
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 'ENOENT'
			) {
				return []
			}
			throw error
		}
	}

	protected validateItem(_item: unknown): boolean {
		return true
	}

	/** Generate a UUID for an item with an empty/missing id. */
	protected ensureId<T extends { id: string }>(item: T): T {
		if (!item.id) {
			item.id = crypto.randomUUID()
		}
		return item
	}

	protected async write(items: T[]): Promise<void> {
		await mkdir(dirname(this.filePath), { recursive: true })
		await writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8')
	}

	abstract get(id: string): Promise<T>
	abstract list(): Promise<Array<ListResult>>
	abstract save(item: T): Promise<void>
	abstract delete(id: string): Promise<void>
}

export default JsonFileRepository
