import type EventBusPort from '@application/ports/EventBus.port'
import type { Envelope } from '@application/ports/EventBus.port'

class InMemoryEventBus implements EventBusPort {
	private readonly subscribers: Array<Subscriber> = []

	publish(envelope: Envelope): void {
		for (const subscriber of this.subscribers) {
			subscriber.resolve(envelope)
		}
	}

	subscribe(): AsyncGenerator<Envelope> & { unsubscribe: () => void } {
		const subscriber = new Subscriber()

		const unsubscribe = () => {
			subscriber.reject(new Error('Unsubscribed'))

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

class Subscriber {
	private resolvable: PromiseWithResolvers<Envelope> = Promise.withResolvers()

	resolve(envelope: Envelope) {
		this.resolvable.resolve(envelope)
		this.resolvable = Promise.withResolvers()
	}

	reject(error: Error) {
		this.resolvable.reject(error)
	}

	async *generate(): AsyncGenerator<Envelope> {
		try {
			while (true) {
				yield await this.resolvable.promise
				this.resolvable = Promise.withResolvers()
			}
		} catch (_error) {
			// gracefully exit the loop
		}
	}
}
