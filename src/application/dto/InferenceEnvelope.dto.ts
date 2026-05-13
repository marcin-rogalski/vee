type InferenceEnvelopeDto = {
	id: string
	sessionId: string
	timestamp: number
} & InferenceEventDto

export default InferenceEnvelopeDto

export type InferenceEventDto =
	| { type: 'prompt'; data: { content: string } }
	| { type: 'token'; data: { content: string } }
	| { type: 'thought'; data: { content: string } }
	| {
			type: 'tool-call'
			data: {
				correlationId: string
				name: string
				arguments: Record<string, unknown>
			}
	  }
	| {
			type: 'tool-response'
			data: { correlationId: string; result: string; code?: number }
	  }
	| { type: 'done'; data?: never }
	| { type: 'error'; data: { message: string; code?: string } }
	| { type: 'compaction'; data?: never }
	| { type: 'compaction-result'; data: { before: number; after: number } }
