import type { Envelope } from '@application/ports/EventBus.port'
import { beforeEach, describe, expect, it } from 'vitest'
import InMemoryEventBus from './InMemoryEventBus'

describe('U4 — InMemoryEventBus', () => {
	let bus: InMemoryEventBus

	beforeEach(() => {
		bus = new InMemoryEventBus()
	})

	it('subscribe() returns an AsyncGenerator directly', async () => {
		const gen = bus.subscribe()
		expect(gen[Symbol.asyncIterator]).toBeDefined()
	})

	it('publish() makes envelope available to subscriber generator', async () => {
		const gen = bus.subscribe()

		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}

		// Start iteration BEFORE publishing so the generator is suspended
		// waiting on the original pending promise.
		const nextPromise = gen.next()

		// Now publish, which resolves the pending promise the generator is waiting on.
		bus.publish(envelope)

		const result = await nextPromise
		expect(result.value).toEqual(
			expect.objectContaining({
				id: 'e1',
				role: 'user',
				type: 'prompt',
				content: 'hello',
			}),
		)
	})

	it('receives all event types (no channel filtering)', async () => {
		const gen = bus.subscribe()

		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'assistant',
			type: 'thought',
			content: 'thinking...',
		}

		// Start iteration BEFORE publishing.
		const nextPromise = gen.next()

		bus.publish(envelope)

		const result = await nextPromise
		expect(result.value).toEqual(
			expect.objectContaining({
				id: 'e1',
				type: 'thought',
			}),
		)
	})

	it('multiple subscribers all receive events', async () => {
		const gen1 = bus.subscribe()
		const gen2 = bus.subscribe()

		const envelope: Envelope = {
			id: 'e1',
			ts: 1000,
			role: 'user',
			type: 'prompt',
			content: 'hello',
		}

		// Start iteration BEFORE publishing for both subscribers.
		const nextPromise1 = gen1.next()
		const nextPromise2 = gen2.next()

		bus.publish(envelope)

		const result1 = await nextPromise1
		const result2 = await nextPromise2
		expect(result1.value).toEqual(expect.objectContaining({ id: 'e1' }))
		expect(result2.value).toEqual(expect.objectContaining({ id: 'e1' }))
	})
})
