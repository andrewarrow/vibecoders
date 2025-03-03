# CLAUDE.md - VibeCoders Project Guidelines

## Build Commands

### Go Backend
- Run server: `go run main.go`
- Build binary: `go build -o vibecoders`

### React Frontend
- Dev server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run serve`

### Database
- Initialize: `npm run db:init`
- Migrate: `npm run db:migrate`
- Check status: `npm run db:info`
- Reset: `npm run db:clean`

## Style Guidelines

### Go
- Imports: Standard library first, then project imports, then third-party
- Error handling: Always check errors and provide context
- Types: Define structs with JSON tags like `json:"field_name"`
- Naming: CamelCase for exported, camelCase for unexported
- Database: Use prepared statements, check for sql.ErrNoRows
- Functions: Group by domain in packages like models, handlers

### React
- Imports: React first, hooks second, components third
- Components: Functional components with ES6 arrow syntax
- Hooks: Use React hooks for state management (useAuth, useState)
- JSX: Use className for CSS classes (Tailwind)
- Props: Destructure props at function parameter level
- Organization: Components in src/components, pages in src/pages