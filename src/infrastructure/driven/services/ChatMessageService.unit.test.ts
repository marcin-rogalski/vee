import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type { ChatMessage } from '@application/ports/ChatMessageRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatMessageServiceAdapter from './ChatMessageService.adapter'

let mockRepository: ChatMessageRepositoryPort
let mockGetBySession: ReturnType<typeof vi.fn>
let mockCreate: ReturnType<typeof vi.fn>
let mockDeleteBySession: ReturnType<typeof vi.fn>
let service: ChatMessageServiceAdapter

beforeEach(() => {
	mockGetBySession = vi.fn().mockResolvedValue([])
	mockCreate = vi.fn().mockResolvedValue(undefined)
	mockDeleteBySession = vi.fn().mockResolvedValue(undefined)

	mockRepository = {
		getBySession: mockGetBySession,
		create: mockCreate,
		deleteBySession: mockDeleteBySession,
	} as unknown as ChatMessageRepositoryPort

	service = new ChatMessageServiceAdapter(mockRepository)
})

describe('ChatMessageServiceAdapter', () => {
	it('delegates create to repository', async () => {
		const message: ChatMessage = {
			id: 'msg-1',
			sessionId: 'session-1',
			role: 'user',
			content: 'Hello',
			ts: 100,
		}

		await service.create(message)

		expect(mockRepository.create).toHaveBeenCalledWith(message)
	})

	it('delegates getBySession to repository', async () => {
		const messages: Array<ChatMessage> = [
			{
				id: 'msg-1',
				sessionId: 'session-1',
				role: 'user',
				content: 'Hello',
				ts: 100,
			},
		]
		mockGetBySession.mockResolvedValue(messages)

		const result = await service.getBySession('session-1')

		expect(mockGetBySession).toHaveBeenCalledWith('session-1')
		expect(result).toEqual(messages)
	})

	it('delegates deleteBySession to repository', async () => {
		await service.deleteBySession('session-1')

		expect(mockRepository.deleteBySession).toHaveBeenCalledWith('session-1')
	})
})
