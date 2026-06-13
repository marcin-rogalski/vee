import type ProviderListUseCase from '@application/usecases/ProviderList.usecase'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const ProviderList = (useCase: ProviderListUseCase) =>
	ExpressEndpoint.createEndpoint(
		'GET',
		'/providers',
		{
			response: z.object({
				providers: z.array(z.object({ id: z.string(), name: z.string() })),
			}),
		},
		async () => ({
			providers: await useCase.execute(),
		}),
	)

export default ProviderList
