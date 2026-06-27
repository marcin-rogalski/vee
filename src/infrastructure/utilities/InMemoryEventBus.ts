import type EventBusPort from '@application/ports/EventBus.port'
import type { Envelope } from '@application/ports/EventBus.port'

class InMemoryEventBus implements EventBusPort {
	private readonly subscribers: Array<Subscriber> = []

	publish(envelope: Envelope): void {
		for (const subscriber of this.subscribers) {
			subscriber.enqueue(envelope)
		}
	}

	subscribe(): AsyncGenerator<Envelope> & { unsubscribe: () => void } {
		const subscriber = new Subscriber()

		this.subscribers.push(subscriber)

		const unsubscribe = () => {
			subscriber.close()

			const index = this.subscribers.indexOf(subscriber)
			if (index !== -1) {
				this.subscribers.splice(index, 1)
			}
		}

		const generator = subscriber.generate()

		Object.assign(generator, { unsubscribe })

		return generator as AsyncGenerator<Envelope> & { unsubscribe: () => void }
	}
}

export default InMemoryEventBus

/** Queue-based subscriber that never drops events.
 *
 * Events are buffered in a queue. The async generator drains the queue
 * before waiting for the next signal, so rapid publishes don't lose data.
 */
class Subscriber {
	private queue: Envelope[] = []
	private closed = false
	private resolvable: PromiseWithResolvers<void> = Promise.withResolvers()

	enqueue(envelope: Envelope): void {
		if (this.closed) {
			return
		}
		this.queue.push(envelope)
		// Resolve the waiter — the generator will drain the queue
		this.resolvable.resolve(undefined)
		this.resolvable = Promise.withResolvers()
	}

	close(): void {
		this.closed = true
		this.resolvable.resolve(undefined)
	}

	async *generate(): AsyncGenerator<Envelope> {
		while (!this.closed) {
			// Wait until at least one event is enqueued
			await this.resolvable.promise

			// Drain all buffered events before waiting again
			while (this.queue.length > 0) {
				const envelope = this.queue.shift()
				if (envelope) {
					yield envelope
				}
			}
		}
	}
}
