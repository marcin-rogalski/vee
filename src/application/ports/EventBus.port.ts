interface EventBusPort {
	publish(envelope: Envelope): void
	subscribe(): AsyncGenerator<Envelope> & { unsubscribe: () => void }
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

	// Session CRUD events
	| { role: 'system'; type: 'session-created'; sessionId: string; name: string }
	| { role: 'system'; type: 'session-deleted'; sessionId: string }

	// Provider CRUD events
	| { role: 'system'; type: 'provider-saved'; providerId: string; name: string }
	| { role: 'system'; type: 'provider-deleted'; providerId: string }

	// Agent CRUD events
	| { role: 'system'; type: 'agent-saved'; agentId: string; name: string }
	| { role: 'system'; type: 'agent-deleted'; agentId: string }
)
