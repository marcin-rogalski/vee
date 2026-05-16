export enum Channel {
	INFERENCE = 'inference',
	SESSION = 'session',
	APP = 'app',
}

type HandlerFn = (envelope: Envelope) => void
type UnsubscribeFn = () => void

interface EventBusPort {
	publish(channel: Channel, envelope: Envelope): Promise<void>
	subscribe(
		channel: Channel,
		eventType: Envelope['type'],
		handler: HandlerFn,
	): UnsubscribeFn
}

export default EventBusPort

export type Envelope = {
	id: string
	ts: number
} & (
	| { role: 'user'; type: 'prompt'; content: string }
	| { role: 'assistant'; type: 'token'; content: string }
	| { role: 'assistant'; type: 'thought'; content: string }
	| {
			role: 'assistant'
			type: 'tool-call'
			toolCalls: Array<{ name: string; arguments: string }>
	  }
	| {
			role: 'system'
			type: 'tool-response'
			name: string
			content: string
			code: number | undefined
	  }
	| { role: 'system'; type: 'done' }
	| { role: 'system'; type: 'error'; message: string }
)
