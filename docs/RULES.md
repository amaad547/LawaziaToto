# AI Coding Rules — Hackathon

## 1. Core Principle

- Optimize for working functionality, simplicity, speed, and low token usage.
- Follow YAGNI: build only what is required.
- Prefer the smallest solution that works.
- Do not overengineer.

## 2. Communication

- Be concise.
- Do not provide long explanations unless explicitly requested.
- Do not repeat information already established in the project.
- Before making changes, briefly state what you will change.
- After making changes, give only a short summary.
- Do not explain obvious code.

## 3. Code Changes

- Make the smallest change necessary.
- Modify only files relevant to the current task.
- Do not rewrite working code unnecessarily.
- Do not refactor unrelated code.
- Do not recreate existing components or utilities.
- Reuse existing components, functions, hooks, and utilities whenever possible.
- Do not create a new file unless it is genuinely necessary.

## 4. Dependencies

- Prefer existing dependencies.
- Do not install a package unless it is necessary.
- Prefer native browser APIs and existing project functionality when practical.
- Do not replace the current technology stack.

## 5. Architecture

- Keep the architecture simple.
- Avoid unnecessary abstraction.
- Avoid unnecessary design patterns.
- Avoid premature optimization.
- Do not introduce a backend, database, authentication system, API, state-management library, or external service unless the requirements actually need it.

## 6. UI

- Keep the UI clean, modern, and responsive.
- Reuse existing UI components and styles.
- Do not spend excessive code on animations or visual effects.
- Avoid unnecessary CSS complexity.
- Every visible interactive element must have a working action.

## 7. Development Workflow

For every task:

1. Inspect the relevant existing code.
2. Make the smallest required change.
3. Run the application or relevant validation.
4. Fix errors caused by the change.
5. Stop when the task works.

Do not continue improving the task unless requested.

## 8. Error Handling

When an error occurs:

- Identify the root cause first.
- Fix the smallest possible part.
- Do not rewrite unrelated code.
- Do not introduce new dependencies just to solve a simple error.
- Verify the fix after applying it.

## 9. Testing

Prioritize testing of:

- Main user flow
- Recently changed functionality
- Build errors
- Runtime errors
- Important buttons and forms

Do not perform unnecessary exhaustive testing during development.

## 10. Token Efficiency

- Do not output large code blocks when a small patch is sufficient.
- Do not repeat unchanged code.
- Do not generate documentation unless requested.
- Do not describe every implementation detail.
- Do not list obvious files or steps.
- Keep responses short and action-oriented.
- Spend tokens on implementation and debugging rather than explanations.

## 11. Context Management

- Read existing project files only when relevant to the current task.
- Do not repeatedly inspect unchanged files.
- Use the existing project documentation as the source of truth.
- Do not ask for information that can be determined from the codebase.
- Do not restate the entire project architecture in every response.

## 12. Hackathon Priority

Priority order:

1. Core functionality
2. Reliability
3. User experience
4. Visual polish
5. Optional features

If time is limited, stop adding features and make the existing application reliable.

## 13. Scope Control

- Implement only the requested task.
- Do not add "nice-to-have" features automatically.
- Do not add future features unless explicitly requested.
- If a requested feature is unnecessarily complex, use the simplest viable implementation.

## 14. Final Rule

A simple working solution is better than a sophisticated incomplete solution.

When in doubt, choose:
- fewer files
- fewer dependencies
- less code
- simpler architecture
- smaller changes
- faster verification