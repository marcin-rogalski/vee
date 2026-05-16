import type EventBusPort from '@application/ports/EventBus.port'
import type { Channel, Envelope } from '@application/ports/EventBus.port'

type HandlerFn = (envelope: Envelope) => void
type UnsubscribeFn = () => void

type Subscription = {
	eventType: string
	handler: HandlerFn
}

class InMemoryEventBus implements EventBusPort {
	private readonly subscriptions: Map<Channel, Array<Subscription>> = new Map()

	async publish(channel: Channel, envelope: Envelope): Promise<void> {
		const subs = this.subscriptions.get(channel)
		if (!subs) return
		for (const sub of subs) {
			if (sub.eventType === envelope.type) {
				sub.handler(envelope)
			}
		}
	}

	subscribe(
		channel: Channel,
		eventType: Envelope['type'],
		handler: HandlerFn,
	): UnsubscribeFn {
		const subs = this.subscriptions.get(channel)
		if (!subs) {
			this.subscriptions.set(channel, [{ eventType, handler }])
		} else {
			subs.push({ eventType, handler })
		}
		return () => {
			const filtered =
				this.subscriptions
					.get(channel)
					?.filter((s) => s.eventType !== eventType && s.handler !== handler) ??
				[]
			this.subscriptions.set(channel, filtered)
		}
	}
}

export default InMemoryEventBus
