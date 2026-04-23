# Contributing to IT Ticketing

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/WebApp_ticketing_IT.git
   cd WebApp_ticketing_IT
   ```
3. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/my-amazing-feature
   ```

## Development Setup

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your local database credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

## Code Style

### Commits
We use **Conventional Commits**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, semicolons, etc)
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Dependency updates, build config

Example:
```
feat: add ticket priority filtering
fix: resolve memory leak in WebSocket handler
docs: update deployment guide for AWS
```

### Code
- Use consistent formatting (ESLint/Prettier if configured)
- Write meaningful variable/function names
- Add comments only for complex logic
- Keep functions focused and testable

## Submitting Changes

1. **Push** to your fork:
   ```bash
   git push origin feature/my-amazing-feature
   ```

2. **Open a Pull Request** with:
   - Clear title and description
   - Reference any related issues (`Closes #123`)
   - Explanation of changes

3. **Address review feedback** - we'll review and provide feedback

## Pull Request Guidelines

- One feature/fix per PR
- Keep PRs focused and reasonably sized
- Include tests for new features
- Update documentation as needed
- Ensure all CI checks pass

## Reporting Issues

Found a bug? Create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, Node version, etc)

## Questions?

- Check existing issues and PRs
- Open a discussion in the repo
- Contact maintainers

Happy coding! 🚀
