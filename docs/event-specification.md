# Session Event Specification

## Event Envelope

Every event emitted through the session event channel is wrapped in a standard envelope:

```typescript
interface EventEnvelope<T> {
    id: string        // Unique per event (UUID)
    sessionId: string // Which session this event belongs to
    timestamp: number // When event was generated (Unix ms)
    type: string      // Event type discriminator
    data: T           // Typed payload
}
```

## Event Types

### LLM Streaming Events

| Type | Data | Description |
|------|------|-------------|
| `token` | `{ content: string }` | Individual token from LLM response |
| `thought` | `{ content: string }` | LLM internal thought process |

### Tool Execution Events

| Type | Data | Description |
|------|------|-------------|
| `tool-call` | `{ id: string; name: string; arguments: Record<string, unknown> }` | Tool invocation request |
| `tool-response` | `{ toolCallId: string; result: string; code?: number }` | Tool execution result with optional status code |

### Control Events

| Type | Data | Description |
|------|------|-------------|
| `done` | `{}` | Inference complete |
| `error` | `{ message: string; code?: string }` | Error during inference |

### Context Management Events

| Type | Data | Description |
|------|------|-------------|
| `compaction` | `{}` | Context compaction started |
| `compaction-result` | `{ before: number; after: number }` | Compaction complete (entry counts) |

## Complete Type Definition

```typescript
type SessionEvent =
    // LLM token streaming
    | { type: 'token'; data: { content: string } }
    
    // LLM internal thought
    | { type: 'thought'; data: { content: string } }
    
    // Tool invocation
    | { type: 'tool-call'; data: { id: string; name: string; arguments: Record<string, unknown> } }
    
    // Tool execution result
    | { type: 'tool-response'; data: { toolCallId: string; result: string; code?: number } }
    
    // Inference complete
    | { type: 'done'; data: {} }
    
    // Error during inference
    | { type: 'error'; data: { message: string; code?: string } }
    
    // Context compaction started
    | { type: 'compaction'; data: {} }
    
    // Context compaction complete
    | { type: 'compaction-result'; data: { before: number; after: number } }
```

## Example Events

```json
// Token streaming
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "abc123",
    "timestamp": 1700000000000,
    "type": "token",
    "data": { "content": "Hello" }
}

// Tool call
{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "sessionId": "abc123",
    "timestamp": 1700000000100,
    "type": "tool-call",
    "data": {
        "id": "t1",
        "name": "getFile",
        "arguments": { "path": "/tmp/file.txt" }
    }
}

// Tool response
{
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "sessionId": "abc123",
    "timestamp": 1700000000200,
    "type": "tool-response",
    "data": {
        "toolCallId": "t1",
        "result": "File contents here",
        "code": 200
    }
}

// Inference complete
{
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "sessionId": "abc123",
    "timestamp": 1700000000300,
    "type": "done",
    "data": {}
}

// Context compaction
{
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "sessionId": "abc123",
    "timestamp": 1700000000400,
    "type": "compaction",
    "data": {}
}

// Context compaction result
{
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "sessionId": "abc123",
    "timestamp": 1700000000500,
    "type": "compaction-result",
    "data": { "before": 100, "after": 50 }
}
```

## Event Flow

```
Client subscribes: GET /events/:sessionId
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│                   Event Bus                         │
│                                                     │
│  InferUseCase ──emit──▶ EventBus ──broadcast──▶ SSE │
│                                                     │
│  Each event wrapped in EventEnvelope               │
│  Events ordered by timestamp                        │
└─────────────────────────────────────────────────────┘
```

## Future Extensions

The following event types are reserved for future use:

- **MCP events**: `mcp-connect`, `mcp-disconnect`, `mcp-tool-available`, `mcp-resource-update`
- **Skill events**: `skill-start`, `skill-progress`, `skill-done`, `skill-error`
- **Client interaction**: `approval-request`, `approval-granted`, `approval-denied`, `input-request`

---

*Created: 2026-05-11*
