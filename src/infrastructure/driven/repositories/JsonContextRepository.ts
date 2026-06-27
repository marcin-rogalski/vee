import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type { ConversationEntry } from '@domain/ConversationEntry'

type ContextStore = Record<string, Array<ConversationEntry>>

class JsonContextRepository implements ContextRepositoryPort {
	constructor(protected readonly filePath: string) {}

	protected async readContexts(): Promise<ContextStore> {
		try {
			const raw = await readFile(this.filePath, 'utf-8')
			const rawContexts: unknown = JSON.parse(raw)
			if (typeof rawContexts !== 'object' || rawContexts === null) {
				return {}
			}
			const contexts: ContextStore = {}
			for (const [sessionId, entries] of Object.entries(
				rawContexts as Record<string, unknown>,
			)) {
				if (!Array.isArray(entries)) {
					continue
				}
				const validEntries = entries.filter(
					(e) =>
						typeof e === 'object' &&
						e !== null &&
						'id' in e &&
						typeof (e as Record<string, unknown>).id === 'string' &&
						'ts' in e &&
						typeof (e as Record<string, unknown>).ts === 'number' &&
						'role' in e &&
						typeof (e as Record<string, unknown>).role === 'string' &&
						'content' in e &&
						typeof (e as Record<string, unknown>).content === 'string',
				)
				if (validEntries.length > 0) {
					contexts[sessionId] = validEntries as ConversationEntry[]
				}
			}
			return contexts
		} catch (error) {
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 'ENOENT'
			) {
				return {}
			}
			throw error
		}
	}

	protected async writeContexts(contexts: ContextStore): Promise<void> {
		await mkdir(dirname(this.filePath), { recursive: true })
		await writeFile(this.filePath, JSON.stringify(contexts, null, 2), 'utf-8')
	}

	async get(sessionId: string): Promise<Array<ConversationEntry>> {
		const contexts = await this.readContexts()
		return contexts[sessionId] ?? []
	}

	async listAll(): Promise<Record<string, Array<ConversationEntry>>> {
		return this.readContexts()
	}

	async append(
		sessionId: string,
		...entries: Array<ConversationEntry>
	): Promise<void> {
		const contexts = await this.readContexts()
		if (!contexts[sessionId]) {
			contexts[sessionId] = []
		}
		contexts[sessionId].push(...entries)
		await this.writeContexts(contexts)
	}

	async update(
		sessionId: string,
		entries: Array<ConversationEntry>,
	): Promise<void> {
		const contexts = await this.readContexts()
		contexts[sessionId] = entries
		await this.writeContexts(contexts)
	}

	async delete(sessionId: string): Promise<void> {
		const contexts = await this.readContexts()
		delete contexts[sessionId]
		await this.writeContexts(contexts)
	}
}

export default JsonContextRepository
