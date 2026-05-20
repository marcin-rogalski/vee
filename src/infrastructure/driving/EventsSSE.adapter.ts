import type EventBusPort from '@application/ports/EventBus.port'
import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

const EventsSSE = (eventBus: EventBusPort) =>
	ExpressEndpoint.createEndpoint(
		'GET',
		'/events',
		{
			sse: z.object({
				id: z.string(),
				ts: z.number(),
				role: z.enum(['user', 'assistant', 'system']),
				type: z.string(),
				content: z.string().optional(),
				toolCalls: z
					.array(z.object({ name: z.string(), arguments: z.string() }))
					.optional(),
				name: z.string().optional(),
				code: z.number().optional(),
				message: z.string().optional(),
				sessionId: z.string().optional(),
				providerId: z.string().optional(),
				agentId: z.string().optional(),
			}),
		},
		async () => {
			return eventBus.subscribe()
		},
	)

export default EventsSSE
