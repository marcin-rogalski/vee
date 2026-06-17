import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type ConversationEntry from '@domain/ConversationEntry'

type ContextStore = Record<string, Array<ConversationEntry>>

class JsonContextRepository implements ContextRepositoryPort {
	constructor(protected readonly filePath: string) {}

	protected async readContexts(): Promise<ContextStore> {
		try {
			const raw = await readFile(this.filePath, 'utf-8')
			return JSON.parse(raw)
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
