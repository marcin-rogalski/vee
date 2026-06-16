import type ProviderUpsertUseCase from '@application/usecases/ProviderUpsert.usecase'
import type { JsonSchemaObject as JsonSchemaObjectType } from '@domain/JsonSchema'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const JsonSchemaProperty = z.object({
	type: z.enum(['string', 'number', 'boolean']),
	description: z.string().optional(),
	enum: z.array(z.string()).optional(),
})

const JsonSchemaObject = z
	.object({
		$schema: z.string(),
		type: z.literal('object'),
		properties: z.record(z.string(), JsonSchemaProperty).default({}),
		required: z.array(z.string()).optional().default([]),
		description: z.string().optional(),
	})
	.transform((obj) => obj as JsonSchemaObjectType)

const ProviderUpsert = (useCase: ProviderUpsertUseCase) =>
	ExpressEndpoint.createEndpoint(
		'POST',
		'/providers',
		{
			body: z.object({
				id: z.string(),
				name: z.string(),
				type: z.string(),
				configSchema: JsonSchemaObject,
				config: z.record(z.string(), z.unknown()).optional(),
			}),
		},
		async (_paras, body) => {
			await useCase.execute({
				id: body.id,
				name: body.name,
				type: body.type,
				configSchema: body.configSchema,
				config: body.config ?? {},
			})
		},
	)

export default ProviderUpsert
