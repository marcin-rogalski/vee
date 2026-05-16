import type SessionCreateUseCase from '@application/usecases/SessionCreate.usecase'
import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

const SessionCreate = (useCase: SessionCreateUseCase) =>
	ExpressEndpoint.createEndpoint(
		'POST',
		'/sessions',
		{
			body: z.object({ name: z.string().optional() }).optional(),
			response: z.object({ id: z.string() }),
		},
		async (_params, body) => {
			const id = await useCase.execute(body?.name)
			return { id }
		},
	)

export default SessionCreate
