import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

type NotFoundCtor = new (entity: string, id: string) => Error

abstract class JsonFileRepository<T> {
	constructor(
		protected readonly filePath: string,
		protected readonly entityName: string,
		protected readonly NotFoundError: NotFoundCtor,
	) {}

	protected async read(): Promise<T[]> {
		try {
			const raw = await readFile(this.filePath, 'utf-8')
			const items: unknown[] = JSON.parse(raw)
			return items.filter((item) => {
				if (this.validateItem(item as T)) {
					return true
				}
				console.warn(
					`[${this.entityName}] Invalid item filtered from ${this.filePath}:`,
					item,
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

	protected validateItem(_item: T): boolean {
		return true
	}

	protected async write(items: T[]): Promise<void> {
		await mkdir(dirname(this.filePath), { recursive: true })
		await writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8')
	}

	abstract get(id: string): Promise<T>
	abstract list(): Promise<unknown>
	abstract save(item: T): Promise<void>
	abstract delete(id: string): Promise<void>
}

export default JsonFileRepository
