import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type ToolPort from '@application/ports/Tool.port'
import type { ToolDefinition } from '@application/ports/Tool.port'
import { z } from 'zod'

const argsSchema = z.object({
	path: z.string(),
	content: z.string(),
})

const parametersSchema = JSON.stringify({
	type: 'object',
	properties: {
		path: { type: 'string', description: 'Path to the file to write' },
		content: {
			type: 'string',
			description: 'Content to write to the file',
		},
	},
	required: ['path', 'content'],
})

class WriteFileAdapter implements ToolPort {
	readonly id: string = 'write_file'
	readonly description: string =
		'Write content to a file at the given path. Creates the file and any missing parent directories. Returns a confirmation message.'
	readonly definition: ToolDefinition = {
		name: 'write_file',
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
		const { path: filePath, content } = args.data
		try {
			await fs.mkdir(path.dirname(filePath), { recursive: true })
			await fs.writeFile(filePath, content, 'utf-8')
			return {
				content: `File written successfully: ${filePath}`,
				code: undefined,
			}
		} catch (err) {
			return {
				content: `Error writing file: ${err instanceof Error ? err.message : String(err)}`,
				code: 500,
			}
		}
	}
}

export default WriteFileAdapter
