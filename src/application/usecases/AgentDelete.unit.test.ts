import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentDeleteUseCase from './AgentDelete.usecase'

describe('UC1 — AgentDelete use case', () => {
	let mockRepository: AgentRepositoryPort
	let mockEventBus: EventBusPort
	let useCase: AgentDeleteUseCase

	beforeEach(() => {
		mockRepository = {
			get: async () => ({
				id: 'agent-1',
				name: 'Test',
				systemPrompt: '',
				providerId: 'p1',
				providerConfiguration: {},
				toolIds: [],
			}),
			list: async () => [],
			save: async () => {},
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
		useCase = new AgentDeleteUseCase(mockRepository, mockEventBus)
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
  		const envelope = (publishSpy.mock.calls[0] as [object])[0]
  		expect(envelope).toHaveProperty('id')
  		expect(envelope).toHaveProperty('ts')
  		expect(typeof (envelope as any).id).toBe('string')
  		expect(typeof (envelope as any).ts).toBe('number')
  		expect((envelope as any).type).toBe('agent-deleted')
  		expect((envelope as any).agentId).toBe('agent-456')
  		expect((envelope as any).role).toBe('system')
  	})

  	it('propagates errors from eventBus.publish', async () => {
  		vi.spyOn(mockRepository, 'delete').mockResolvedValue(undefined)
  		vi.spyOn(mockEventBus, 'publish').mockRejectedValue(new Error('Event bus unavailable'))
  		await expect(useCase.execute('agent-789')).rejects.toThrow('Event bus unavailable')
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
  		const envelope = (publishSpy.mock.calls[0] as [object])[0]
  		expect((envelope as any).agentId).toBe(null)
  	})

  	it('includes undefined id in event envelope when passed to execute', async () => {
  		const publishSpy = vi.spyOn(mockEventBus, 'publish')
  		await useCase.execute(undefined as unknown as string)
  		const envelope = (publishSpy.mock.calls[0] as [object])[0]
  		expect((envelope as any).agentId).toBe(undefined)
  	})

  	it('verifies exact event envelope structure (agentId, type, timestamp, id, role)', async () => {
  		const publishSpy = vi.spyOn(mockEventBus, 'publish')
  		const testAgentId = 'agent-verify-envelope'
  		await useCase.execute(testAgentId)
  		const envelope = (publishSpy.mock.calls[0] as [object])[0] as Record<string, unknown>
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
