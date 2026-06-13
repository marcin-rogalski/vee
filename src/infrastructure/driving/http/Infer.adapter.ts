import type InferUseCase from '@application/usecases/Infer.usecase'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const Infer = (useCase: InferUseCase) =>
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
			await useCase.execute(body.prompt, body.agentId, body.sessionId)
		},
	)

export default Infer
