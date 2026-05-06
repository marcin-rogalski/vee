interface LoggerPort {
	info(event: string, fields: Record<string, unknown>): void;
	warn(event: string, fields: Record<string, unknown>): void;
	error(event: string, fields: Record<string, unknown>, err?: unknown): void;
	debug(event: string, fields: Record<string, unknown>): void;
}

export default LoggerPort;
