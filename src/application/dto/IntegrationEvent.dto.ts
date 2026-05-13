type IntegrationEventDto =
	| { type: 'token'; data: { content: string } }
	| { type: 'thought'; data: { content: string } }
	| {
			type: 'tool-call'
			data: { name: string; arguments: Record<string, unknown> }
	  }

export default IntegrationEventDto
