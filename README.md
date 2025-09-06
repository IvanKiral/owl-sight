# owl-sight

A video insight extraction tool that downloads audio from videos and transcribes them using OpenAI's Whisper. This is a pnpm monorepo with Turbo for build orchestration, focused on recipe summarization and analysis.

## Repository Structure

This monorepo contains the following packages:

- **packages/owl-cli**: Main CLI tool for recipe summarization and analysis
- **packages/visual-insights**: Core library with download and transcription functionality

## Prerequisites

Before using owl-sight, you need to install these global dependencies:

### Required Global Tools

1. **pnpm** - Package manager
   ```bash
   npm install -g pnpm
   ```

2. **yt-dlp** - Video/audio downloading
   ```bash
   # macOS (via Homebrew)
   brew install yt-dlp

   # Ubuntu/Debian
   sudo apt install yt-dlp
   ```

3. **OpenAI Whisper** - Audio transcription
   ```bash
   pip install openai-whisper
   ```

4. **ffmpeg** - Audio processing
   ```bash
   # macOS (via Homebrew)
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt install ffmpeg
   ```

## Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd owl-sight
   pnpm bootstrap
   ```

2. Build all packages:
   ```bash
   pnpm build
   ```

## Installing the CLI Globally

To make the `owl-cli` CLI available system-wide, you can use the convenient npm script from the root:

```bash
npm run link:cli
```

Or manually from the package directory:

```bash
cd packages/owl-cli
pnpm link --global
```

After installation, you can use the CLI from anywhere:

```bash
owl-cli --help
```

To remove the global link:

```bash
npm run unlink:cli
```

## Development

### Code Quality

```bash
pnpm biome:check         # Run Biome checks
pnpm biome:check:fix     # Fix Biome issues automatically
pnpm lint                # Run ESLint across all packages
```

### Running the CLI Locally

```bash
pnpm --filter owl-cli start
```

### Building Individual Packages

```bash
pnpm --filter visual-insights build
pnpm --filter owl-cli build
pnpm --filter cli build
```

## Requirements

- Node.js >= 22.0.0
- pnpm package manager

## License

See [LICENSE](LICENSE) file for details.
