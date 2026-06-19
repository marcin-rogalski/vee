import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type { ChatMessage } from '@domain/ChatMessage'
import { NotFoundError } from '@domain/errors'
import JsonFileRepository from './JsonFileRepository'

class JsonChatMessageRepository
	extends JsonFileRepository<ChatMessage>
	implements ChatMessageRepositoryPort
{
	constructor(filePath: string) {
		super(filePath, 'ChatMessage', NotFoundError)
	}

	validateItem(item: unknown): boolean {
		if (typeof item !== 'object' || item === null) {
			return false
		}
		const obj = item as Record<string, unknown>
		return (
			typeof obj.id === 'string' &&
			typeof obj.sessionId === 'string' &&
			typeof obj.role === 'string' &&
			typeof obj.content === 'string' &&
			typeof obj.ts === 'number'
		)
	}

	async get(_id: string): Promise<ChatMessage> {
		throw new Error('Not implemented - use getBySession instead')
	}

	async list(): Promise<Array<ChatMessage>> {
		return this.read()
	}

	async getBySession(sessionId: string): Promise<Array<ChatMessage>> {
		const messages = await this.read()
		return messages.filter((m) => m.sessionId === sessionId)
	}

	async listAll(): Promise<Array<ChatMessage>> {
		return this.read()
	}

	async create(message: ChatMessage): Promise<void> {
		const messages = await this.read()
		// Cap messages per session to bound growth
		const sessionMessages = messages.filter(
			(m) => m.sessionId !== message.sessionId,
		)
		if (sessionMessages.length >= 100) {
			// Remove oldest messages to stay at limit
			messages.splice(0, messages.length - 99)
		}
		messages.push(message)
		await this.write(messages)
	}

	async save(item: ChatMessage): Promise<void> {
		await this.create(item)
	}

	async delete(_id: string): Promise<void> {
		throw new Error('Not implemented - use deleteBySession instead')
	}

	async deleteBySession(sessionId: string): Promise<void> {
		const messages = await this.read()
		const filtered = messages.filter((m) => m.sessionId !== sessionId)
		await this.write(filtered)
	}
}

export default JsonChatMessageRepository
