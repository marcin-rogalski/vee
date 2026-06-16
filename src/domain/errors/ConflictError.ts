import { AppError } from './AppError'

export class ConflictError extends AppError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(message, 'CONFLICT', 409, details)
	}
}
