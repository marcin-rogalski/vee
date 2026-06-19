import type { JsonSchemaObject } from '@domain/JsonSchema'

/** Service that validates config objects against JSON Schema. */
interface SchemaValidationService {
	validate(config: Record<string, unknown>, schema: JsonSchemaObject): void
}

export default SchemaValidationService
