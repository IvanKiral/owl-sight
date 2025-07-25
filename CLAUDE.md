# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

owl-sight is a video insight extraction tool that downloads audio from videos and transcribes them using OpenAI's Whisper. It's structured as a pnpm monorepo with Turbo for build orchestration.

## Architecture

The project uses a monorepo structure with two main packages:

- **packages/cli**: Command-line interface for the tool
- **packages/visual-insights**: Core library with download and transcription functionality

## Development Commands

### Setup
```bash
pnpm bootstrap  # Install all dependencies
```

### Build
```bash
pnpm build      # Build all packages via Turbo
```

### Code Quality
```bash
pnpm biome:check         # Run Biome checks
pnpm biome:check:fix     # Fix Biome issues automatically
pnpm lint                # Run ESLint across all packages
```

### Run the CLI
```bash
pnpm --filter cli start
```

### Build Individual Packages
```bash
pnpm --filter visual-insights build

pnpm --filter cli build
```

## External Dependencies

The following tools must be installed on your system:
- **yt-dlp**: For downloading videos/audio from various platforms
- **whisper**: OpenAI's Whisper for audio transcription


## TypeScript Best Practices

### Core Principles
- **Prioritize readability over performance** - Focus on clean, easy-to-understand code
- **Complete implementation** - NO todos, placeholders, or missing pieces
- **Be honest about limitations** - If uncertain or don't know something, say so explicitly

#### General Code Quality
- **NO Object-Oriented Programming**: Avoid classes, inheritance, and OOP patterns. Always prefer functions and composition over classes and inheritance
- **Functional programming principles**: Use pure functions, immutable data structures, and function composition
- **Types instead interfaces**: Whenever possible use types instead of interfaces
- **Early returns**: Use early returns to reduce nesting and improve readability
- **Descriptive naming**: Use clear, self-documenting variable and function names
- **Event handlers**: Prefix with "handle" (e.g., `handleClick`, `handleKeyDown`)
- **Function declarations**: Use `const` arrow functions with explicit return types when possible
  ```typescript
  const calculateTotal = (items: ReadonlyArray<Item>): number => {
    // implementation
  }
  ```

  ## Commits
  - Use clear messages
  - Do not mention yourself in the messages
