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
			return JSON.parse(raw)
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
