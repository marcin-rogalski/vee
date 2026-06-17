import type SessionListUseCase from '@application/usecases/SessionList.usecase'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const SessionList = (useCase: SessionListUseCase) =>
	ExpressEndpoint.createEndpoint(
		'GET',
		'/sessions',
		{
			response: z.object({
				sessions: z.array(
					z.object({ id: z.string(), name: z.string(), agentId: z.string() }),
				),
			}),
		},
		async () => {
			return { sessions: await useCase.execute() }
		},
	)

export default SessionList
