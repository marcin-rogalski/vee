import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type { Envelope } from '@application/ports/EventBus.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentDeleteUseCase from './AgentDelete.usecase'

type EnvelopeGenerator = AsyncGenerator<Envelope> & { unsubscribe: () => void }

describe('UC1 — AgentDelete use case', () => {
	let mockRepository: AgentRepositoryPort
	let mockSessionRepository: SessionRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: AgentDeleteUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'agent-1',
				name: 'Test',
				systemPrompt: '',
				providerId: 'p1',
				providerOverrides: {},
				toolIds: [],
			}),
			list: async () => [],
			listByProviderId: async () => [],
			save: async () => {},
			delete: async () => {},
		}
		mockSessionRepository = {
			get: async () => ({
				id: 'session-1',
				name: '',
				agentId: 'agent-1',
				createdAt: 0,
				updatedAt: 0,
			}),
			list: async () => [],
			listByAgentId: async () => [],
			create: async () => ({
				id: 'session-1',
				name: '',
				agentId: 'agent-1',
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
		useCase = new AgentDeleteUseCase(
			mockRepository,
			mockSessionRepository,
			mockEventBus,
		)
	})

	it('calls agentRepository.delete(id) with correct id', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute('agent-123')
		expect(deleteSpy).toHaveBeenCalledWith('agent-123')
	})

	it('propagates errors from repository', async () => {
		vi.spyOn(mockRepository, 'delete').mockRejectedValue(
			new Error('Database error'),
		)
		await expect(useCase.execute('agent-123')).rejects.toThrow('Database error')
	})

	it('publishes an agent-deleted event', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('agent-123')
		expect(publishSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'agent-deleted',
				agentId: 'agent-123',
				id: expect.any(String),
				role: 'system',
				ts: expect.any(Number),
			}),
		)
	})

	it('publishes event envelope with correct type contract (single argument)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute('agent-456')
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'agent-deleted' }
		>
		expect(envelope).toHaveProperty('id')
		expect(envelope).toHaveProperty('ts')
		expect(typeof envelope.id).toBe('string')
		expect(typeof envelope.ts).toBe('number')
		expect(envelope.type).toBe('agent-deleted')
		expect(envelope.agentId).toBe('agent-456')
		expect(envelope.role).toBe('system')
	})

	it('does not await eventBus.publish', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		publishSpy.mockReturnValue(undefined)
		await expect(useCase.execute('agent-456')).resolves.toBeUndefined()
	})

	it('passes empty string id through to repository (no validation in use case)', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute('')
		expect(deleteSpy).toHaveBeenCalledWith('')
	})

	it('passes null id through to repository (no runtime type enforcement)', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute(null as unknown as string)
		expect(deleteSpy).toHaveBeenCalledWith(null)
	})

	it('passes undefined id through to repository (no runtime type enforcement)', async () => {
		const deleteSpy = vi.spyOn(mockRepository, 'delete')
		await useCase.execute(undefined as unknown as string)
		expect(deleteSpy).toHaveBeenCalledWith(undefined)
	})

	it('includes null id in event envelope when passed to execute', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute(null as unknown as string)
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'agent-deleted' }
		>
		expect(envelope.agentId).toBe(null)
	})

	it('includes undefined id in event envelope when passed to execute', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		await useCase.execute(undefined as unknown as string)
		const envelope = publishSpy.mock.calls[0]?.[0] as Extract<
			Envelope,
			{ type: 'agent-deleted' }
		>
		expect(envelope.agentId).toBe(undefined)
	})

	it('verifies exact event envelope structure (agentId, type, timestamp, id, role)', async () => {
		const publishSpy = vi.spyOn(mockEventBus, 'publish')
		const testAgentId = 'agent-verify-envelope'
		await useCase.execute(testAgentId)
		const envelope = (publishSpy.mock.calls[0] as [object])[0] as Record<
			string,
			unknown
		>
		// id: string (crypto.randomUUID)
		expect(envelope).toHaveProperty('id')
		expect(typeof envelope.id).toBe('string')
		expect((envelope.id as string).length).toBeGreaterThan(0)
		// ts: number (Date.now)
		expect(envelope).toHaveProperty('ts')
		expect(typeof envelope.ts).toBe('number')
		expect(Number.isInteger(envelope.ts)).toBe(true)
		expect(envelope.ts).toBeLessThanOrEqual(Date.now())
		// role: 'system'
		expect(envelope).toHaveProperty('role')
		expect(envelope.role).toBe('system')
		// type: 'agent-deleted'
		expect(envelope).toHaveProperty('type')
		expect(envelope.type).toBe('agent-deleted')
		// agentId: matches the id passed to execute
		expect(envelope).toHaveProperty('agentId')
		expect(envelope.agentId).toBe(testAgentId)
	})
})
