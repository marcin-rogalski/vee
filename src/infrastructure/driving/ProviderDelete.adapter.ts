import type ProviderDeleteUseCase from '@application/usecases/ProviderDelete.usecase'
import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

const ProviderDelete = (useCase: ProviderDeleteUseCase) =>
	ExpressEndpoint.createEndpoint(
		'DELETE',
		'/providers/{id:string}',
		{ params: z.object({ id: z.string() }) },
		async (params) => {
			await useCase.execute(params.id)
		},
	)

export default ProviderDelete
