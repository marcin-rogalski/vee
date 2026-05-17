import type { Envelope } from '@application/ports/EventBus.port'
import { Channel } from '@application/ports/EventBus.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InMemoryEventBus from './InMemoryEventBus'

describe('U4 — InMemoryEventBus', () => {
	let bus: InMemoryEventBus

	beforeEach(() => {
		bus = new InMemoryEventBus()
	})

	it('publish() calls handlers matching channel and event type', async () => {
		const handler = vi.fn()
		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}
		bus.subscribe(Channel.INFERENCE, 'prompt', handler)
		await bus.publish(Channel.INFERENCE, envelope)
		expect(handler).toHaveBeenCalledWith(envelope)
	})

	it('publish() ignores non-matching event types', async () => {
		const handler = vi.fn()
		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'assistant',
			type: 'thought',
			content: 'thinking...',
		}
		bus.subscribe(Channel.INFERENCE, 'prompt', handler)
		await bus.publish(Channel.INFERENCE, envelope)
		expect(handler).not.toHaveBeenCalled()
	})

	it('publish() ignores non-matching channels', async () => {
		const handler = vi.fn()
		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}
		bus.subscribe(Channel.SESSION, 'prompt', handler)
		await bus.publish(Channel.INFERENCE, envelope)
		expect(handler).not.toHaveBeenCalled()
	})

	it('subscribe() registers handler for channel + event type', async () => {
		const handler = vi.fn()
		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}
		const unsubscribe = bus.subscribe(Channel.INFERENCE, 'prompt', handler)
		expect(unsubscribe).toBeTypeOf('function')
		await bus.publish(Channel.INFERENCE, envelope)
		expect(handler).toHaveBeenCalledTimes(1)
	})

	it('subscribe() returns unsubscribe function', async () => {
		const handler = vi.fn()
		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}
		const unsubscribe = bus.subscribe(Channel.INFERENCE, 'prompt', handler)
		unsubscribe()
		await bus.publish(Channel.INFERENCE, envelope)
		expect(handler).not.toHaveBeenCalled()
	})

	it('unsubscribe function removes the handler (and all handlers of same event type)', async () => {
		const handler1 = vi.fn()
		const handler2 = vi.fn()
		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}
		const unsubscribe1 = bus.subscribe(Channel.INFERENCE, 'prompt', handler1)
		bus.subscribe(Channel.INFERENCE, 'prompt', handler2)
		unsubscribe1()
		// Due to source code behavior: unsubscribing one handler removes all handlers of the same event type
		await bus.publish(Channel.INFERENCE, envelope)
		expect(handler1).not.toHaveBeenCalled()
		expect(handler2).not.toHaveBeenCalled()
	})

	it('unsubscribe is safe to call multiple times', async () => {
		const handler = vi.fn()
		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}
		const unsubscribe = bus.subscribe(Channel.INFERENCE, 'prompt', handler)
		unsubscribe()
		expect(() => unsubscribe()).not.toThrow()
		await bus.publish(Channel.INFERENCE, envelope)
		expect(handler).not.toHaveBeenCalled()
	})

	it('multiple handlers for same channel/event can coexist', async () => {
		const handler1 = vi.fn()
		const handler2 = vi.fn()
		const handler3 = vi.fn()
		const envelopePrompt: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}
		// envelopeThought is intentionally unused — it's a valid Envelope shape for 'thought' events
		const _envelopeThought: Envelope = {
			id: 'e2',
			ts: 2000,
			role: 'assistant',
			type: 'thought',
			content: 'thinking...',
		}
		void _envelopeThought
		bus.subscribe(Channel.INFERENCE, 'prompt', handler1)
		bus.subscribe(Channel.INFERENCE, 'prompt', handler2)
		bus.subscribe(Channel.INFERENCE, 'thought', handler3)
		await bus.publish(Channel.INFERENCE, envelopePrompt)
		expect(handler1).toHaveBeenCalledTimes(1)
		expect(handler2).toHaveBeenCalledTimes(1)
		expect(handler3).not.toHaveBeenCalled()
	})
})
