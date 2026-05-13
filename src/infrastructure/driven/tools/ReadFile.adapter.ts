import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'
import type ToolPort from '@application/ports/Tool.port'
import { z } from 'zod'

const argsSchema = z.object({
	path: z.string(),
})

class ReadFileAdapter implements ToolPort {
	readonly definition: ToolDefinitionDto = {
		name: 'read_file',
		description:
			'Read the contents of a file at the given path. Returns the file contents as a string.',
		parameters: {
			type: 'object',
			properties: {
				path: { type: 'string', description: 'Path to the file to read' },
			},
			required: ['path'],
		},
	}

	async execute(raw: Record<string, unknown>): Promise<string> {
		const { path: rawPath } = argsSchema.parse(raw)
		const resolved = rawPath.startsWith('~/')
			? path.join(os.homedir(), rawPath.slice(2))
			: rawPath
		try {
			return await fs.readFile(resolved, 'utf-8')
		} catch (err) {
			return `Error reading file: ${err instanceof Error ? err.message : String(err)}`
		}
	}
}

export default ReadFileAdapter
