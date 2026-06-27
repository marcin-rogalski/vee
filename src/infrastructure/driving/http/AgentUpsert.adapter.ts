import type AgentUpsertUseCase from '@application/usecases/AgentUpsert.usecase'
import { Agent, type AgentData } from '@domain/Agent'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'

const AgentUpsert = (useCase: AgentUpsertUseCase) =>
	ExpressEndpoint.createEndpoint(
		'POST',
		'/agents',
		{
			body: Agent.schema,
		},
		async (_params, body) => {
			const agent: AgentData = {
				id: body.id,
				name: body.name,
				systemPrompt: body.systemPrompt,
				providerId: body.providerId,
				providerOverrides: body.providerOverrides,
				toolIds: body.toolIds,
				...(body.description !== undefined && {
					description: body.description,
				}),
			}
			await useCase.execute(agent)
		},
	)

export default AgentUpsert
