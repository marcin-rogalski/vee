import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import type ToolPort from '@application/ports/Tool.port'
import type { ToolDefinition } from '@application/ports/Tool.port'
import { z } from 'zod'

const argsSchema = z.object({
	path: z.string(),
})

const parametersSchema = JSON.stringify({
	type: 'object',
	properties: {
		path: { type: 'string', description: 'Path to the file to read' },
	},
	required: ['path'],
})

class ReadFileAdapter implements ToolPort {
	readonly id: string = 'read_file'
	readonly description: string =
		'Read the contents of a file at the given path. Returns the file contents as a string.'
	readonly definition: ToolDefinition = {
		name: 'read_file',
		description: this.description,
		parameters: parametersSchema,
	}

	async execute(
		raw: string,
	): Promise<{ content: string; code: number | undefined }> {
		let parsed: Record<string, unknown>
		try {
			parsed = JSON.parse(raw)
		} catch {
			return { content: 'Error: invalid JSON input', code: 400 }
		}
		const args = argsSchema.safeParse(parsed)
		if (!args.success) {
			return {
				content: `Error: invalid arguments: ${args.error.message}`,
				code: 400,
			}
		}
		const { path: rawPath } = args.data
		const resolved = rawPath.startsWith('~/')
			? path.join(os.homedir(), rawPath.slice(2))
			: rawPath
		try {
			const content = await fs.readFile(resolved, 'utf-8')
			return { content, code: undefined }
		} catch (err) {
			return {
				content: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
				code: 500,
			}
		}
	}
}

export default ReadFileAdapter
