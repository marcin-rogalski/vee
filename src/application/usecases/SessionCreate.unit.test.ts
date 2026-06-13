import type EventBusPort from '@application/ports/EventBus.port'
import type { Envelope } from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionCreateUseCase from './SessionCreate.usecase'

type EnvelopeGenerator = AsyncGenerator<Envelope> & { unsubscribe: () => void }

describe('UC4 — SessionCreate use case', () => {
	let mockRepository: SessionRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: SessionCreateUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'session-1',
				name: '',
				createdAt: 0,
				updatedAt: 0,
			}),
			list: async () => [],
			create: async (name: string) => ({
				id: 'session-1',
				name,
				createdAt: 0,
				updatedAt: 0,
			}),
			setName: async () => {},
			delete: async () => {},
		}
		mockEventBus = {
			publish: vi.fn(),
			subscribe: vi.fn().mockReturnValue({
				next: vi.fn(),
				return: vi.fn(),
				throw: vi.fn(),
				[Symbol.asyncIterator]: vi.fn(),
				unsubscribe: vi.fn(),
			} as unknown as EnvelopeGenerator),
		}
		useCase = new SessionCreateUseCase(mockRepository, mockEventBus)
	})

	it('returns session id from repository', async () => {
		const result = await useCase.execute()
		expect(result).toBe('session-1')
	})

	it('passes empty string when name is undefined', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute()
		expect(createSpy).toHaveBeenCalledWith('')
	})

	it('passes provided name when given', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute('My Session')
		expect(createSpy).toHaveBeenCalledWith('My Session')
	})

	it('publishes a session-created event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('Test Session')
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'session-created',
				sessionId: 'session-1',
				name: 'Test Session',
				id: expect.any(String),
				role: 'system',
				ts: expect.any(Number),
			}),
		)
	})

	it('publishes event envelope with correct type contract (single argument)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('Another Session')
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'session-created' }
		>
		expect(envelope?.id).toBeDefined()
		expect(envelope?.ts).toBeDefined()
		expect(typeof envelope.id).toBe('string')
		expect(typeof envelope.ts).toBe('number')
		expect(envelope.type).toBe('session-created')
		expect(envelope.sessionId).toBe('session-1')
		expect(envelope.name).toBe('Another Session')
		expect(envelope.role).toBe('system')
	})

	it('creates session even when eventBus.publish fails (fire-and-forget)', async () => {
		vi.spyOn(mockRepository, 'create').mockResolvedValue({
			id: 'session-2',
			name: 'Error Session',
			createdAt: 0,
			updatedAt: 0,
		})
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(
			new Error('Event bus unavailable'),
		)
		const result = await useCase.execute('Error Session')
		expect(result).toBe('session-2')
	})

	// --- Edge case: invalid name types ---

	it('passes empty string when name is a number', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute(42 as unknown as string)
		expect(createSpy).toHaveBeenCalledWith('')
	})

	it('passes empty string when name is null', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute(null as unknown as string)
		expect(createSpy).toHaveBeenCalledWith('')
	})

	it('passes empty string when name is a boolean', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute(true as unknown as string)
		expect(createSpy).toHaveBeenCalledWith('')
	})

	// --- Edge case: empty string name (falsy but not null/undefined) ---

	it('passes empty string when name is explicitly empty string', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute('')
		expect(createSpy).toHaveBeenCalledWith('')
	})

	// --- Edge case: boundary lengths ---

	it('handles single character name', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute('A')
		expect(createSpy).toHaveBeenCalledWith('A')
	})

	it('handles very long name (10K+ characters)', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		const longName = 'x'.repeat(10001)
		await useCase.execute(longName)
		expect(createSpy).toHaveBeenCalledWith(longName)
	})

	// --- Event envelope structure verification ---

	it('publishes event with sessionId and name from the session object', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('Boundary Session')
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'session-created' }
		>
		expect(envelope?.sessionId).toBe('session-1')
		expect(envelope.name).toBe('Boundary Session')
		expect(typeof envelope.id).toBe('string')
		expect(envelope.id.length).toBeGreaterThan(0)
		expect(typeof envelope.ts).toBe('number')
		expect(envelope.ts).toBeLessThanOrEqual(Date.now())
		expect(envelope.type).toBe('session-created')
		expect(envelope.role).toBe('system')
	})
})
