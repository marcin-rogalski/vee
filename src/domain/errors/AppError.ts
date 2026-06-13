export abstract class AppError extends Error {
	readonly code: string
	readonly statusCode: number
	readonly metadata: Record<string, unknown>

	constructor(
		message: string,
		code: string,
		statusCode: number,
		metadata?: Record<string, unknown>,
	) {
		super(message)
		this.name = this.constructor.name
		this.code = code
		this.statusCode = statusCode
		this.metadata = metadata ?? {}
		Object.setPrototypeOf(this, new.target.prototype)
	}

	isAppError(): this is AppError {
		return true
	}
}
