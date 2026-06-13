import { AppError } from './AppError'

export class ValidationError extends AppError {
	constructor(details: Record<string, string>) {
		super('Validation failed', 'VALIDATION_ERROR', 400, { details })
	}
}
