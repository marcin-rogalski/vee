import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ConsoleLogger from './ConsoleLogger.adapter'

describe('U1 — ConsoleLogger', () => {
	let logger: ConsoleLogger
	let writeSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		logger = new ConsoleLogger()
		writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
	})

	afterEach(() => {
		writeSpy.mockClear()
	})

	it('info() writes JSON with level: info and ts timestamp', () => {
		logger.info('test event', { key: 'value' })
		const output = JSON.parse(writeSpy.mock.calls[0][0] as string)
		expect(output.level).toBe('info')
		expect(output.event).toBe('test event')
		expect(output.key).toBe('value')
		expect(typeof output.ts).toBe('number')
	})

	it('warn() writes JSON with level: warn', () => {
		logger.warn('warning event', { code: 42 })
		const output = JSON.parse(writeSpy.mock.calls[0][0] as string)
		expect(output.level).toBe('warn')
		expect(output.event).toBe('warning event')
		expect(output.code).toBe(42)
	})

	it('error() writes JSON with level: error and error details (message, stack)', () => {
		const err = new Error('test error')
		logger.error('error event', { context: 'test' }, err)
		const output = JSON.parse(writeSpy.mock.calls[0][0] as string)
		expect(output.level).toBe('error')
		expect(output.event).toBe('error event')
		expect(output.error.message).toBe('test error')
		expect(typeof output.error.stack).toBe('string')
	})

	it('error() handles non-Error objects (falls back to String(err))', () => {
		logger.error('error event', {}, 'a string error' as unknown as Error)
		const output = JSON.parse(writeSpy.mock.calls[0][0] as string)
		expect(output.level).toBe('error')
		expect(output.error.message).toBe('a string error')
		expect(output.error.stack).toBeUndefined()
	})

	it('error() omits error field when no error argument provided', () => {
		logger.error('error event', {})
		const output = JSON.parse(writeSpy.mock.calls[0][0] as string)
		expect(output.error).toBeUndefined()
	})

	it('debug() is a no-op', () => {
		logger.debug('debug event', {})
		expect(writeSpy).not.toHaveBeenCalled()
	})
})
