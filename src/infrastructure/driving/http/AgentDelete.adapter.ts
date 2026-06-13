import type AgentDeleteUseCase from '@application/usecases/AgentDelete.usecase'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const AgentDelete = (useCase: AgentDeleteUseCase) =>
	ExpressEndpoint.createEndpoint(
		'DELETE',
		'/agents/{id:string}',
		{ params: z.object({ id: z.string() }) },
		async (params) => {
			await useCase.execute(params.id)
		},
	)

export default AgentDelete
