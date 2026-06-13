import { AppError } from './AppError'

export class NotFoundError extends AppError {
	constructor(entity: string, id: string) {
		super(`${entity} with id ${id} not found`, 'NOT_FOUND', 404, { entity, id })
	}
}
