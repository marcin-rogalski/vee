import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type { ChatMessage } from '@application/ports/ChatMessageRepository.port'

class JsonChatMessageRepository implements ChatMessageRepositoryPort {
	constructor(protected readonly filePath: string) {}

	protected async read(): Promise<Array<ChatMessage>> {
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

	protected async write(messages: Array<ChatMessage>): Promise<void> {
		await mkdir(dirname(this.filePath), { recursive: true })
		await writeFile(this.filePath, JSON.stringify(messages, null, 2), 'utf-8')
	}

	async getBySession(sessionId: string): Promise<Array<ChatMessage>> {
		const messages = await this.read()
		return messages.filter((m) => m.sessionId === sessionId)
	}

	async create(message: ChatMessage): Promise<void> {
		const messages = await this.read()
		messages.push(message)
		await this.write(messages)
	}

	async deleteBySession(sessionId: string): Promise<void> {
		const messages = await this.read()
		const filtered = messages.filter((m) => m.sessionId !== sessionId)
		await this.write(filtered)
	}
}

export default JsonChatMessageRepository
