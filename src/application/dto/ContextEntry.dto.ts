type ContextEntryDto =
	| { author: 'system'; data: string }
	| { author: 'user' | 'assistant'; data: string; ts: number }
	| {
			author: 'tool-call'
			id: string
			name: string
			arguments: object
			ts: number
	  }
	| {
			author: 'tool-result'
			id: string
			result: string
			ts: number
	  }

export default ContextEntryDto
