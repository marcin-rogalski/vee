# ADR: Self-Contained Provider Architecture

## Context

Current state:
- `ProviderPort` interface defines the contract (countTokens, compact, shouldCompact, infer)
- `DefaultProviderRegistry` uses factory functions to resolve providers by type string
- No actual provider implementations exist yet
- Provider domain entity stores config schema as `Array<ConfigurationSchema>`
- ConfigScreen forms are generic and don't know about provider-specific schemas

Goal: Each provider should be self-contained with:
1. Own configuration schema
2. Own form layout for the CLI TUI
3. Unified inference mechanism via ProviderPort

## Decision

Create a base class `ProviderBase` that implements `ProviderPort` and enforces self-containment:

```typescript
abstract class ProviderBase implements ProviderPort {
  abstract id: string
  abstract type: string
  
  // Each provider defines its own config schema
  static CONFIG_SCHEMA: readonly ConfigurationSchema[]
  
  // Each provider defines its form layout (for CLI TUI)
  static FORM_LAYOUT: readonly FormFieldLayout[]
  
  // Unified inference - each provider implements the actual API calls
  abstract infer(
    configuration: Record<string, unknown>,
    context: readonly ConversationEntry[],
    tools: readonly ToolDefinition[],
  ): AsyncGenerator<ProviderEvent>
  
  // Common behavior that can be overridden
  countTokens(contextEntry: ConversationEntry): number {
    return contextEntry.content.length / 4 // Default heuristic
  }
  
  async compact(context: readonly ConversationEntry[]): Promise<Array<ConversationEntry>> {
    throw new NotImplementedError('compact not implemented')
  }
  
  shouldCompact(context: readonly ConversationEntry[]): boolean {
    return false // Default: don't compact
  }
}
```

Concrete providers extend this base:
```typescript
class OpenAIProvider extends ProviderBase {
  static CONFIG_SCHEMA = [
    { key: 'apiKey', required: true, type: 'string', options: undefined, description: 'OpenAI API Key' },
    { key: 'model', required: false, type: 'string', options: ['gpt-4', 'gpt-3.5-turbo'], description: 'Model to use' },
  ] as const
  
  static FORM_LAYOUT = [
    { field: 'apiKey', label: 'API Key', component: 'TextInput', secure: true },
    { field: 'model', label: 'Model', component: 'SelectInput', options: ['gpt-4', 'gpt-3.5-turbo'] },
  ] as const
  
  // Implements actual OpenAI API calls
  infer(...) { /* ... */ }
}

class AnthropicProvider extends ProviderBase {
  static CONFIG_SCHEMA = [ /* ... */ ]
  static FORM_LAYOUT = [ /* ... */ ]
  infer(...) { /* ... */ }
}
```

## Consequences

**Positive:**
- Each provider is fully self-contained - schema, form layout, and implementation in one class
- Registry registers by type string → concrete class: `providerRegistry.register('openai', () => new OpenAIProvider())`
- ConfigScreen can query `PROVIDER_TYPES[providerType].FORM_LAYOUT` to render provider-specific forms
- Adding new providers is simple - just create new class extending ProviderBase

**Negative:**
- Slight coupling between domain (ProviderPort) and infrastructure (form layouts)
- Form layout definitions are TypeScript constants, not runtime-enforced

## Implementation Plan

1. Create `src/infrastructure/driven/providers/` directory
2. Create `ProviderBase.abstract.ts` with abstract class
3. Move `ProviderEvent` type from Provider.port.ts to a shared location (or keep it in the port)
4. Update `DefaultProviderRegistry` to work with ProviderBase instances
5. Create first concrete provider implementation as example (e.g., OpenAIProvider)
6. Update ConfigScreen to use provider-specific form layouts
