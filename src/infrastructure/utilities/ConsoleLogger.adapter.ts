import type LoggerPort from '@application/ports/Logger.port'

class ConsoleLogger implements LoggerPort {
	info(event: string, fields: Record<string, unknown>): void {
		process.stdout.write(
			JSON.stringify({ level: 'info', event, ...fields, ts: Date.now() }) +
				'\n',
		)
	}

	warn(event: string, fields: Record<string, unknown>): void {
		process.stdout.write(
			JSON.stringify({ level: 'warn', event, ...fields, ts: Date.now() }) +
				'\n',
		)
	}

	error(event: string, fields: Record<string, unknown>, err?: unknown): void {
		const errorField: Record<string, unknown> = {}
		if (err !== undefined) {
			if (err instanceof Error) {
				errorField.error = { message: err.message, stack: err.stack }
			} else {
				errorField.error = { message: String(err) }
			}
		}
		process.stdout.write(
			// biome-ignore lint/style/useTemplate: no reason to use template here
			JSON.stringify({
				level: 'error',
				event,
				...fields,
				...errorField,
				ts: Date.now(),
			}) + '\n',
		)
	}

	debug(_event: string, _fields: Record<string, unknown>): void {}
}

export default ConsoleLogger
