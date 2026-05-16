import type AgentUpsertUseCase from '@application/usecases/AgentUpsert.usecase'
import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

const AgentUpsert = (useCase: AgentUpsertUseCase) =>
	ExpressEndpoint.createEndpoint(
		'POST',
		'/agents',
		{
			body: z.object({
				id: z.string(),
				name: z.string(),
				description: z.string().optional(),
				providerId: z.string(),
				providerConfiguration: z.record(z.string(), z.unknown()),
				toolIds: z.array(z.string()),
			}),
		},
		async (_params, body) => {
			await useCase.execute(body)
		},
	)

export default AgentUpsert
