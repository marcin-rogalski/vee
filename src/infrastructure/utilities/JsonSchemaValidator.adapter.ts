import { ValidationError } from '@domain/errors'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import { z } from 'zod'

/** Validates a config object against a JSON Schema.
 *
 * Uses Zod v4's native fromJSONSchema for the conversion, then safeParse
 * for validation. Throws ValidationError if the config is invalid.
 */
export function validateJsonSchema(
	config: Record<string, unknown>,
	schema: JsonSchemaObject,
): void {
	// Our JsonSchemaObject is a structurally compatible subset of Zod's internal
	// JSONSchema type. The cast bridges minor type differences (enum widening,
	// optional property handling) that don't affect runtime behavior.
	const zodSchema = z.fromJSONSchema(
		schema as Parameters<typeof z.fromJSONSchema>[0],
	)
	const result = zodSchema.safeParse(config)

	if (!result.success) {
		const details: Record<string, string> = {}
		for (const issue of result.error.issues) {
			const path = issue.path.join('.') || '_'
			details[path] = issue.message
		}
		throw new ValidationError(details)
	}
}
