import type SchemaValidationService from '@application/ports/SchemaValidationService.port'
import { validateJsonSchema } from '@infrastructure/utilities/JsonSchemaValidator.adapter'

class SchemaValidationServiceAdapter implements SchemaValidationService {
	public validate(
		config: Record<string, unknown>,
		schema: Parameters<typeof validateJsonSchema>[1],
	): void {
		validateJsonSchema(config, schema)
	}
}

export default SchemaValidationServiceAdapter
