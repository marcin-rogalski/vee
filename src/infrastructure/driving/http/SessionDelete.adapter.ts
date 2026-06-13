import type SessionDeleteUseCase from '@application/usecases/SessionDelete.usecase'
import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import z from 'zod'

const SessionDelete = (useCase: SessionDeleteUseCase) =>
	ExpressEndpoint.createEndpoint(
		'DELETE',
		'/sessions/{id:string}',
		{ params: z.object({ id: z.string() }) },
		async (params) => {
			await useCase.execute(params.id)
		},
	)

export default SessionDelete
