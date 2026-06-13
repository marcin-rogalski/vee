import { AppError } from './AppError'

export class InternalError extends AppError {
	constructor(cause?: Error) {
		const message = cause?.message ?? 'An unexpected error occurred'
		super(message, 'INTERNAL_ERROR', 500, { cause: cause?.stack })
	}
}
