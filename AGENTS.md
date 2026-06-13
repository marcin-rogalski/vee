# Coding Preferences

## TypeScript
- Avoid re-exports in TypeScript files — it's a code smell. Import directly from the source file.

## Testing
- Never add test-specific methods, properties, or code to production files.
- Use test subclasses (extending the production class) to access `protected` members instead of adding `*ForTest` methods or exposing private fields via getters.
- If a production class cannot be tested without test-specific code, refactor the class design (e.g., make fields `protected` instead of `private`, or expose behavior through the port interface).
- Test-specific code belongs exclusively in test files or test helper modules.

## Verification
- After every code change, run `tsc --noEmit` and `biome check --fix --unsafe` to verify typecheck and lint pass. Do not commit or declare work done until both commands succeed.

## Artifacts
- All project artifacts (plans, architecture docs, ADRs, entities, concepts) go in `.artifacts/` at the project root.
- Never use `.claude/` or `.opencode/artifacts/` for project artifacts.
