---
type: idea
slug: refactor-infer-use-case-for-better-architecture
status: exploring
created: 2026-05-23
last_synced: 
references: [src/application/usecases/Infer.usecase.ts]
related_decisions: []
related_entities: []
related_plans: []
related_ideas: []
summary: Refactor InferUseCase to improve modularity and testability
---

# Refactor Infer Use Case for Better Architecture

## Problem
The current `InferUseCase` (165 lines) violates single responsibility principle by handling multiple concerns:
- Agent/Provider resolution logic
- User message handling
- Context management (compaction)
- Token streaming coordination  
- Tool call handling
- Tool execution orchestration
- Event publishing
- State management (pendingTokens, pendingToolCalls)

This creates a complex, hard-to-test class that mixes business logic with orchestration logic.

## Goals
- Break the complex use case into focused, single-responsibility components
- Maintain clean orchestration between components
- Improve testability by making each component independently testable
- Set up proper grounding for future extension (skills, MCP, new event types)
- Maintain current functionality while improving architecture

## Use cases
- As a developer, I want to resolve agents and providers independently, so that I can test resolution logic in isolation
- As a developer, I want to handle user messages independently, so that I can ensure proper event publishing
- As a developer, I want to manage context independently, so that I can handle compaction logic separately
- As a developer, I want to orchestrate inference independently, so that I can handle different inference events cleanly
- As a developer, I want to orchestrate tool execution independently, so that I can extend to support multiple execution patterns
- As a developer, I want to have clean dependencies between components, so that the system remains loosely coupled
- As a developer, I want the refactored system to be easily extensible for future features like skills and MCP

## Non-goals
- Don't change the public API of the refactored components
- Don't break existing functionality during refactoring
- Don't introduce new abstractions without clear purpose
- Don't make the system more complex than necessary

## Constraints
- Must maintain hexagonal architecture principles
- Dependencies must flow inward (infrastructure → application → domain)
- All components must be easily testable in isolation
- Component interfaces must be clean and follow port pattern
- Refactoring must be done incrementally

## Open questions
- How should we handle the dependency injection for the new components?
- What's the best way to maintain existing event publishing behavior?
- How do we ensure the refactoring doesn't break existing tests?
- Should the orchestration components be stateless or maintain some internal state?

## Possible directions

### Direction 1: Responsibility-Based Split (Recommended)
Break the InferUseCase into focused components:

1. **AgentResolutionUseCase** - Handle agent and provider resolution
2. **MessageHandlingUseCase** - Handle user message creation and publishing
3. **ContextManagementUseCase** - Handle context retrieval and compaction
4. **InferenceOrchestrator** - Handle inference event coordination
5. **ToolExecutionOrchestrator** - Handle tool call execution and response coordination

Each component has single responsibility and clean dependencies. The main InferUseCase becomes a coordinator that orchestrates these components.

### Direction 2: Event-Driven Split
Create event-driven components that communicate through the existing EventBus:

1. **AgentResolutionService** - Publishes "agent-resolved" events
2. **MessageHandlingService** - Publishes "message-created" events  
3. **ContextManagementService** - Publishes "context-ready" events
4. **InferenceCoordinator** - Listens to inference events and handles coordination
5. **ToolExecutionCoordinator** - Listens to tool execution events

This approach maximizes decoupling but adds more event handling complexity.

### Direction 3: Minimal Split (Alternative)
Extract only the most complex parts into separate components while keeping most logic together:

1. **ContextManager** - Extract context compaction logic
2. **ToolCallHandler** - Extract tool execution logic
3. Keep the main inference loop in the original class but delegate to these components

This reduces complexity less but is safer and faster to implement.

## Decision points
- Must decide between the three splitting approaches
- Must determine if state management should stay in coordinator or move to components
- Must plan the refactoring sequence to minimize risk

## Change log
2026-05-23 — Initial brainstorm of refactoring InferUseCase for better architecture — (by: brainstorm)