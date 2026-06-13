import type ProviderUpsertUseCase from '@application/usecases/ProviderUpsert.usecase'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const ProviderUpsert = (useCase: ProviderUpsertUseCase) =>
	ExpressEndpoint.createEndpoint(
		'POST',
		'/providers',
		{
			body: z.object({
				id: z.string(),
				name: z.string(),
				type: z.string(),
				configSchema: z.array(
					z.object({
						key: z.string(),
						required: z.boolean(),
						type: z.literal(['string', 'number', 'boolean']),
						options: z.array(z.union([z.string(), z.number()])).optional(),
						description: z.string(),
					}),
				),
			}),
		},
		async (_paras, body) => {
			await useCase.execute({
				id: body.id,
				name: body.name,
				type: body.type,
				configSchema: body.configSchema.map((item) => ({
					key: item.key,
					required: item.required,
					type: item.type,
					options: item.options,
					description: item.description,
				})),
			})
		},
	)

export default ProviderUpsert
