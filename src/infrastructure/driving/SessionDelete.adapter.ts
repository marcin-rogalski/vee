import type SessionDeleteUseCase from '@application/usecases/SessionDelete.usecase'
import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

let _useCase: SessionDeleteUseCase

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
