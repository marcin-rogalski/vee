import type InferHandler from '@infrastructure/driving/handlers/InferHandler'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const Infer = (handler: InferHandler) =>
	ExpressEndpoint.createEndpoint(
		'POST',
		'/infer',
		{
			body: z.object({
				prompt: z.string(),
				agentId: z.string(),
				sessionId: z.string(),
			}),
		},
		async (_params, body) => {
			await handler.execute(body.prompt, body.agentId, body.sessionId)
		},
	)

export default Infer
