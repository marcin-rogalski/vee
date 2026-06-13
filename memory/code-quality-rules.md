# Code Quality Rules — Research Summary

Sources: Google TypeScript Style Guide, Google Engineering Practices, Kent C. Dodds (Testing Trophy, "Write Tests"), Martin Fowler (Test Pyramid), typescript-eslint rules, SOLID principles (Robert C. Martin), Clean Architecture (Robert C. Martin).

---

## 1. TypeScript Compiler / Linting Rules

### Must enforce (error level)
- **`no-unused-vars`** — Dead code is a maintenance burden.
- **`no-unused-expressions`** — Prevents accidental side-effect-free expressions.
- **`no-floating-promises`** — Unhandled promises silently swallow errors.
- **`no-misused-promises`** — Prevents passing async functions where sync is expected.
- **`no-unsafe-assignment` / `no-unsafe-argument` / `no-unsafe-call` / `no-unsafe-member-access`** — Core safety rules; `any` escapes should be explicit, not accidental.
- **`no-explicit-any`** — Prefer `unknown` for truly unknown values. Suppress with `// biome-ignore` when justified.
- **`no-dupe-class-members`** — Overlapping method/field definitions.
- **`no-invalid-void-type`** — `void` only valid as return type.
- **`no-non-null-assertion`** — `!` operator bypasses type safety; prefer explicit checks.
- **`no-unnecessary-condition`** — Conditions that are always true/false at runtime (e.g., `if (value !== undefined)` when value is already narrowed).
- **`no-unnecessary-type-assertion`** — Redundant `as` casts.
- **`no-base-to-string`** — Calling `.toString()` on objects produces `[object Object]`; use `JSON.stringify` or custom serializer.
- **`no-array-constructor`** — `new Array(n)` is confusing (`[undefined, undefined]` vs `[2, 3]`). Use `[]` or `Array.from`.
- **`no-loop-func`** — Closures over loop variables capture the *last* value, not the current one.
- **`no-this-alias` / `no-this-reference-before-super`** — Prevents `const self = this` anti-pattern.
- **`no-redeclare`** — Variable/type redeclarations.
- **`no-shadow`** — Inner variables shadowing outer ones.
- **`no-unsafe-enum-comparison`** — Enum comparison with `Boolean()` or `!!` is surprising (first enum value is 0/falsy).
- **`no-meaningless-void-operator`** — `void` operator used where its result is consumed.
- **`no-loss-of-precision`** — Numbers losing precision in literals.
- **`no-inferrable-types`** — Redundant type annotations on `const/let` with obvious values.
- **`no-unbound-method`** — Unbound methods passed as callbacks lose `this`.
- **`no-useless-constructor`** — Empty or delegating constructors.
- **`no-extraneous-class`** — Classes with no instance members (use namespace/module instead).
- **`no-confusing-void-expression`** — `void` return type mixed with `Promise<void>` confusion.
- **`no-dupe-class-members`** — Duplicate method/field definitions.
- **`no-unsafe-declaration-merging`** — Conflicting merged declarations.
- **`no-redundant-type-constituents`** — Redundant union/type constituents.
- **`no-unsafe-type-assertion`** — Type assertions that bypass type safety.
- **`no-unsafe-unary-minus`** — Unary minus on non-numeric types.
- **`no-unsafe-argument`** — Passing `any` to typed function parameters.
- **`no-unsafe-assignment`** — Assigning `any` to typed variables.
- **`no-unsafe-call`** — Calling values of non-function types.
- **`no-unsafe-member-access`** — Accessing properties on `unknown` without narrowing.
- **`no-unsafe-return`** — Returning values of incompatible types.
- **`await-thenable`** — Awaiting non-Promises.
- **`prefer-optional-chain`** — Manual null checks that can be `?.`.
- **`prefer-nullish-coalescing`** — `||` instead of `??` for falsy vs nullish.
- **`prefer-includes`** — `indexOf(x) !== -1` instead of `includes(x)`.
- **`prefer-regexp-exec`** — `match()` instead of `exec()`.
- **`prefer-string-starts-ends-with`** — `substr/substring` instead of `startsWith/endsWith`.
- **`switch-exhaustiveness-check`** — Missing enum/discriminated union cases.
- **`no-floating-promises`** — Unhandled promises.
- **`no-misused-promises`** — Async/sync signature mismatches.
- **`no-implied-eval`** — `setTimeout("string")` equivalent.
- **`no-invalid-this`** — `this` in non-class context.
- **`no-var-requires`** — `require()` instead of ES6 imports.
- **`no-wrapper-object-types`** — `String/Number/Boolean` objects.
- **`no-namespace`** — TypeScript namespaces (use modules).
- **`no-unsafe-assignment`** — `any` assignment.
- **`no-unsafe-call`** — Calling non-functions.
- **`no-unsafe-member-access`** — Property access on `unknown`.
- **`no-unsafe-return`** — Incompatible return types.
- **`no-unsafe-argument`** — Unsafe argument passing.
- **`no-unsafe-type-assertion`** — Unsafe type assertions.
- **`no-unsafe-unary-minus`** — Unary minus on non-numeric.
- **`no-unsafe-declaration-merging`** — Conflicting merged declarations.
- **`no-unsafe-enum-comparison`** — Enum boolean coercion.
- **`no-unsafe-function-type`** — Unsafe function types.

### Should enforce (warning level)
- **`no-magic-numbers`** — Magic numbers reduce readability. Configure exceptions (e.g., `0`, `1`, `-1`).
- **`max-params`** — Functions with >4 parameters likely violate Single Responsibility. Default: 4.
- **`no-type-alias`** — Type aliases hide the actual type. Prefer `interface` or inline types.
- **`no-unnecessary-type-arguments`** — Generic type arguments inferred from usage.
- **`no-unnecessary-type-constraint`** — Redundant type constraints.
- **`no-unnecessary-boolean-literal-compare`** — Comparing booleans to `true`/`false`.
- **`no-unnecessary-qualifier`** — Unnecessary namespace qualifiers.
- **`no-unnecessary-template-expression`** — Template expressions that simplify to literals.
- **`no-unnecessary-type-parameters`** — Redundant generic type parameters.
- **`no-unsafe-assignment`** — Unsafe assignment (already covered above).
- **`no-unsafe-call`** — Unsafe call (already covered above).
- **`no-unsafe-member-access`** — Unsafe member access (already covered above).
- **`no-unsafe-return`** — Unsafe return (already covered above).
- **`no-unsafe-argument`** — Unsafe argument (already covered above).
- **`no-unsafe-type-assertion`** — Unsafe type assertion (already covered above).
- **`no-unsafe-unary-minus`** — Unsafe unary minus (already covered above).
- **`no-unsafe-declaration-merging`** — Unsafe declaration merging (already covered above).
### Prefer (suggestions)
- **`prefer-readonly`** — Mark properties `readonly` when never reassigned.
- **`prefer-readonly-parameter-types`** — Mark parameter types `readonly` for immutability guarantees.
- **`prefer-as-const`** — `as const` instead of `as Type` for literal values.
- **`prefer-return-this-type`** — Return `this` type for method chaining.
- **`prefer-function-type`** — Function types over object types with single call signature.
- **`prefer-enum-initializers`** — Enum initializers from other enums.
- **`prefer-literal-enum-member`** — Literal enum member access.
- **`prefer-const`** — Variables never reassigned should be `const`.
- **`prefer-destructuring`** — Destructuring for array/object access.
- **`prefer-for-of`** — `for...of` over `for...in` for arrays.
- **`prefer-find`** — `find()` over `findIndex()`.
- **`array-type`** — Generic type arrays (`Array<T>`) vs bracket notation (`T[]`).
- **`consistent-generic-constructors`** — Consistent generic constructors.
- **`consistent-indexed-object-style`** — Consistent indexed object style.
- **`consistent-type-assertions`** — Consistent type assertion style (`as Type` vs `<Type>`).
- **`consistent-type-exports`** — Consistent type export style.
- **`consistent-type-imports`** — Consistent type import style (prefer `import type` over `import { type }`).
- **`member-ordering`** — Consistent member ordering (constructors, methods, fields).
- **`method-signature-style`** — Consistent method signature style.
- **`no-parameter-properties`** — Parameter properties (use explicit fields for clarity).
- **`parameter-properties`** — Parameter properties are acceptable when documented.
- **`sort-type-constituents`** — Sort union type constituents alphabetically.
- **`strict-boolean-expressions`** — Strict boolean expressions (no non-boolean in conditionals).
- **`strict-void-return`** — Consistent void return type style.
- **`typedef`** — Type annotations on parameters and return types.
- **`unified-signatures`** — Unified signature styles.
- **`use-unknown-in-catch-callback-variable`** — Use `unknown` in catch clauses.

---

## 2. Architecture Rules

### Source: Clean Architecture (Robert C. Martin), Google TypeScript Style Guide, Google Engineering Practices

1. **Dependency Rule** — Source code dependencies point inward. Outer layers (infrastructure, UI) depend on inner layers (domain, application). Inner layers know nothing about outer layers.
2. **Port/Adapter Pattern** — Interfaces (ports) defined in inner layers. Implementations (adapters) in outer layers. Injection via constructor.
3. **No Framework Coupling** — Domain logic must not import framework classes (Express, React, etc.). Frameworks are details.
4. **Testability by Design** — Pure functions and pure classes (domain) are trivially testable. Infrastructure is isolated behind ports.
5. **File Organization** — One file, one export. Named exports only (no `export default`). Use file scope for namespacing, not container classes.
6. **Import/Export Type** — Use `import type` for type-only imports. Use `export type` for type re-exports.
7. **Modules, Not Namespaces** — Use ES6 modules (`import/export`). Never use `namespace`.
8. **Minimize Export Surface** — Only export symbols used outside the module. Minimize public API surface.
9. **No Mutable Exports** — Never `export let`. Use explicit getter functions for mutable state.
10. **No Container Classes** — Export individual constants and functions, not classes with static members.
11. **No Prototype Manipulation** — Never manipulate prototypes directly. Mixins and modifying built-in prototypes are forbidden.
12. **No `this` in Static Context** — Static methods must not reference `this`.
13. **No Private Identifiers (`#`)** — Use TypeScript `private` visibility. Private identifiers cause emit size/performance regressions.
14. **Use `readonly`** — Mark properties never reassigned outside constructor as `readonly`.
15. **Field Initializers** — Initialize class members where declared, not in constructor.
16. **No `Object`/`Array` Constructors** — Use `{}` and `[]` literals.
17. **No `for...in` Without Filtering** — Use `Object.keys()` or `Object.entries()` with `for...of`.
18. **No `var`** — Use `const` (default) or `let`.
19. **One Variable Per Declaration** — `let a = 1; let b = 2;` not `let a = 1, b = 2;`.
20. **Prefer Function Declarations** — Named functions use `function` declarations. Arrow functions for callbacks.
21. **No Function Expressions** — Use arrow functions instead.
22. **Concise Body When Return Value Used** — Block body when return value is unused.
23. **No `this` Rebinding** — Use arrow functions to manage `this` at call time.
24. **No Arrow Function Properties** — Except event handlers that require stable references.
25. **No `bind()` in Event Installation** — Creates temporary reference that can't be uninstalled.
26. **No Side Effects in Parameter Initializers** — Default parameter values must be side-effect free.
27. **No `arguments` Object** — Use rest parameters (`...args`).
28. **No `Function.prototype.apply`** — Use spread syntax.
29. **No `this` for Global Object** — Only use `this` in class constructors/methods or arrow functions where `this` is available.
30. **No `Object`/`Array` Prototypes** — Use literals.
31. **No Line Continuations** — Use string concatenation or template literals.
32. **No Unary Plus for Number Coercion** — Use `Number()` with explicit `NaN` check.
33. **No `parseInt`/`parseFloat`** — Use `Number()` (except for non-base-10 parsing with regex validation).
34. **No Enum Boolean Coercion** — Compare enums explicitly with `!==`.
35. **No Implicit Boolean Coercion** — Compare enums explicitly in conditionals.
36. **No `Object` Constructor** — Use `{}` literal.
37. **No `Array` Constructor** — Use `[]` literal or `Array.from()`.
38. **No `new Date` Without Validation** — Validate date parsing.
39. **No `eval`** — Use `Function` constructor or parsed alternatives.
40. **No `with` Statement** — Never use `with`.

---

## 3. Testing Rules

### Sources: Kent C. Dodds ("Write Tests. Not too many. Mostly integration"), Google Testing Blog, Martin Fowler (Test Pyramid / Testing Trophy)

1. **Write Tests** — If you value your time, write automated tests. Catching bugs locally is cheaper than fixing them in production.
2. **Not Too Many** — Diminishing returns beyond ~70% coverage for applications. 100% coverage for libraries is acceptable (and expected).
3. **Mostly Integration** — Integration tests provide the best balance of confidence vs. speed/cost. Unit tests for pure logic. E2E for critical user journeys.
4. **Avoid Testing Implementation Details** — Tests that test implementation details:
   - **False negatives**: Break when you refactor application code (even if behavior is correct).
   - **False positives**: May not fail when you break application code.
5. **Minimize Mocking** — Mocking removes confidence in the integration between what you're testing and what's being mocked. Only mock external boundaries (HTTP, filesystem, databases).
6. **Static Typing + Linting ≈ High Confidence** — TypeScript and ESLint catch a remarkable amount of bugs. Tests should focus on business logic that typing cannot express.
7. **Tests Should Survive Refactoring** — If you frequently have to change tests when refactoring, you're testing implementation details.
8. **Testing Trophy > Testing Pyramid** — Modern tools (TypeScript, ESLint) provide significant confidence. The hierarchy is:
   - **Static** (TypeScript, ESLint) — Highest ROI, catches the most bugs.
   - **E2E** (Cypress, Playwright) — Highest confidence for user journeys.
   - **Integration** (Jest, Vitest) — Best balance for business logic.
   - **Unit** — Only for pure functions with no dependencies.
9. **No Shallow Rendering** — Shallow rendering tests implementation details (component tree structure), not user-visible behavior.
10. **Test User-Visible Behavior** — Test what the user sees/does, not internal state, props, or component hierarchy.
11. **Prefer Real Dependencies** — Use real database, real HTTP client, real file system in tests when feasible. Fallback to mocks only for truly external boundaries.
12. **One Assertion Per Test? No.** — Test one *behavior*, which may involve multiple assertions about the same outcome.

---

## 4. Testability Rules

### Sources: Google Engineering Practices, Clean Architecture, SOLID Principles

1. **Dependency Injection** — All dependencies injected via constructor. No `new` inside business logic.
2. **Interfaces Define Contracts** — Every external dependency has an interface (port) in the application layer. Implementation in infrastructure.
3. **Pure Functions Where Possible** — Domain logic should be pure functions (same input → same output, no side effects).
4. **No Global State** — Global state makes tests non-deterministic. Use dependency injection or context objects.
5. **Single Responsibility** — Classes/functions with ≤4 parameters and ≤20 lines of logic are easier to test.
6. **Open/Closed** — Extend behavior without modifying existing code. Use composition, not inheritance.
7. **Liskov Substitution** — Subtypes must be substitutable for base types without breaking tests.
8. **Interface Segregation** — Small, focused interfaces. No "fat" interfaces with unused methods.
9. **Dependency Inversion** — Depend on abstractions (interfaces), not concretions.
10. **Testability is a First-Class Concern** — If a class is hard to test, it's likely violating SOLID. Refactor before writing tests.

---

## 5. Applied to This Project

### Already following ✅
- Port/Adapter pattern (ports in application, adapters in infrastructure)
- Dependency injection via constructors
- Named exports only
- `import type` for type-only imports
- `readonly` on properties never reassigned
- Field initializers (members initialized where declared)
- `const`/`let` only (no `var`)
- Arrow functions for callbacks
- No namespaces (using ES6 modules)
- No `Object`/`Array` constructors
- No prototype manipulation
- No `export default`
- No mutable exports
- No container classes
- No private identifiers (`#`)
- No `this` in static context
- No `for...in` without filtering
- No `Array` constructor
- No `Object` constructor

### Should add ⚠️
- `no-magic-numbers` (warning) — Replace magic HTTP status codes with named constants.
- `max-params` (warning, set to 4) — Some functions exceed 4 parameters.
- `no-type-alias` (warning) — Review type aliases vs interfaces.
- `no-unnecessary-condition` (error) — Remove always-true/false conditions.
- `no-unnecessary-type-assertion` (error) — Remove redundant type casts.
- `prefer-optional-chain` (suggestion) — Replace manual null checks with `?.`.
- `prefer-nullish-coalescing` (suggestion) — Replace `||` with `??` where appropriate.
- `prefer-readonly` (suggestion) — Mark properties never reassigned as `readonly`.
- `prefer-readonly-parameter-types` (suggestion) — Mark parameter types `readonly` for immutability.
- `switch-exhaustiveness-check` (error) — Ensure all enum/discriminated union cases handled.
- `no-floating-promises` (error) — Ensure all promises are awaited or handled.
- `no-misused-promises` (error) — Ensure async/sync signatures match.
- `no-unsafe-enum-comparison` (error) — Compare enums explicitly, never with `Boolean()`/`!!`.
- `no-unnecessary-condition` (error) — Remove conditions always true/false.
- `no-unnecessary-type-assertion` (error) — Remove redundant type assertions.
- `no-base-to-string` (error) — Use `JSON.stringify` instead of `.toString()` on objects.
- `no-array-constructor` (error) — Use `[]` instead of `new Array()`.
- `no-loop-func` (error) — Avoid closures over loop variables.
- `no-this-alias` (error) — Use arrow functions instead of `const self = this`.
- `no-redeclare` (error) — Remove variable/type redeclarations.
- `no-shadow` (error) — Remove variables shadowing outer scope.
- `no-invalid-void-type` (error) — `void` only valid as return type.
- `no-non-null-assertion` (warning) — Prefer explicit null checks over `!`.
- `no-confusing-void-expression` (error) — Avoid mixing `void` and `Promise<void>`.
- `no-dupe-class-members` (error) — Remove duplicate method/field definitions.
- `no-extraneous-class` (warning) — Classes with no instance members should be modules.
- `no-useless-constructor` (warning) — Remove empty or delegating constructors.
- `no-unbound-method` (warning) — Unbound methods passed as callbacks.
- `no-import-type-side-effects` (warning) — Type imports with side effects.
- `no-require-imports` (error) — Use ES6 imports, not `require()`.
- `no-wrapper-object-types` (error) — Don't use `String`/`Number`/`Boolean` objects.
- `no-namespace` (error) — Use ES6 modules, not TypeScript namespaces.
- `no-unsafe-assignment` (error) — Prevent `any` assignment.
- `no-unsafe-argument` (error) — Prevent unsafe argument passing.
- `no-unsafe-call` (error) — Prevent calling non-functions.
- `no-unsafe-member-access` (error) — Prevent property access on `unknown`.
- `no-unsafe-return` (error) — Prevent incompatible return types.
- `no-unsafe-type-assertion` (error) — Prevent unsafe type assertions.
- `no-unsafe-unary-minus` (error) — Prevent unary minus on non-numeric.
- `no-unsafe-declaration-merging` (error) — Prevent conflicting merged declarations.
- `no-unsafe-enum-comparison` (error) — Prevent enum boolean coercion.
- `no-unsafe-function-type` (error) — Prevent unsafe function types.
- `no-floating-promises` (error) — Ensure all promises are awaited.
- `no-misused-promises` (error) — Ensure async/sync signatures match.
- `await-thenable` (error) — Await only Promises.
- `no-implied-eval` (error) — No `setTimeout("string")` equivalent.
- `no-invalid-this` (error) — No `this` in non-class context.
- `no-var-requires` (error) — Use ES6 imports.
- `no-wrapper-object-types` (error) — No `String`/`Number`/`Boolean` objects.
- `no-namespace` (error) — Use ES6 modules.
- `no-unsafe-assignment` (error) — Prevent `any` assignment.
- `no-unsafe-argument` (error) — Prevent unsafe argument passing.
- `no-unsafe-call` (error) — Prevent calling non-functions.
- `no-unsafe-member-access` (error) — Prevent property access on `unknown`.
- `no-unsafe-return` (error) — Prevent incompatible return types.
- `no-unsafe-type-assertion` (error) — Prevent unsafe type assertions.
- `no-unsafe-unary-minus` (error) — Prevent unary minus on non-numeric.
- `no-unsafe-declaration-merging` (error) — Prevent conflicting merged declarations.
- `no-unsafe-enum-comparison` (error) — Prevent enum boolean coercion.
- `no-unsafe-function-type` (error) — Prevent unsafe function types.

### Testing improvements
- Shift toward integration tests over unit tests for business logic.
- Minimize mocking — use real dependencies where feasible.
- Test user-visible behavior, not internal state.
- Ensure tests survive refactoring (no implementation detail testing).
- Aim for ~70%+ coverage for application code (100% for libraries).
