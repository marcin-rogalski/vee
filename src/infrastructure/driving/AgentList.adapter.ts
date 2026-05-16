import type AgentListUseCase from '@application/usecases/AgentList.usecase'
import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

const AgentList = (useCase: AgentListUseCase) =>
	ExpressEndpoint.createEndpoint(
		'GET',
		'/agents',
		{
			response: z.object({
				agents: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						description: z.string().optional(),
					}),
				),
			}),
		},
		async () => {
			return { agents: await useCase.execute() }
		},
	)

export default AgentList
