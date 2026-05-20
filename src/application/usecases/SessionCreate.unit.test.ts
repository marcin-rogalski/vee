import type EventBusPort from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionCreateUseCase from './SessionCreate.usecase'

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
			} as unknown as AsyncGenerator<
				import('@application/ports/EventBus.port').Envelope
			> & {
				unsubscribe: () => void
			}),
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
		const envelope = (publishSpy.mock.calls[0] as [object])[0]
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof (envelope as any).id).toBe('string')
		expect(typeof (envelope as any).ts).toBe('number')
		expect((envelope as any).type).toBe('session-created')
		expect((envelope as any).sessionId).toBe('session-1')
		expect((envelope as any).name).toBe('Another Session')
		expect((envelope as any).role).toBe('system')
	})

	it('propagates errors from eventBus.publish', async () => {
		vi.spyOn(mockRepository, 'create').mockResolvedValue({
			id: 'session-2',
			name: 'Error Session',
			createdAt: 0,
			updatedAt: 0,
		})
		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(new Error('Event bus unavailable'))
		await expect(useCase.execute('Error Session')).rejects.toThrow('Event bus unavailable')
	})

	// --- Edge case: invalid name types ---

	it('passes empty string when name is a number (as any)', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute((42 as any) as string)
		expect(createSpy).toHaveBeenCalledWith('')
	})

	it('passes empty string when name is null (as any)', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute((null as any) as string)
		expect(createSpy).toHaveBeenCalledWith('')
	})

	it('passes empty string when name is a boolean (as any)', async () => {
		const createSpy = vi.spyOn(mockRepository, 'create')
		await useCase.execute((true as any) as string)
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
		const envelope = (publishSpy.mock.calls[0] as [object])[0]
		expect((envelope as any).sessionId).toBe('session-1')
		expect((envelope as any).name).toBe('Boundary Session')
		expect(typeof (envelope as any).id).toBe('string')
		expect((envelope as any).id.length).toBeGreaterThan(0)
		expect(typeof (envelope as any).ts).toBe('number')
		expect((envelope as any).ts).toBeLessThanOrEqual(Date.now())
		expect((envelope as any).type).toBe('session-created')
		expect((envelope as any).role).toBe('system')
	})
})
