# owl-cli

CLI tool for recipe summarization and video analysis.

## Recipe Summarization

Extract and summarize recipes from video URLs:

```bash
owl-cli recipe https://www.youtube.com/watch?v=example
```

## Commands

- **`doctor`** - Check system dependencies and configuration. Verifies that required tools (whisper, yt-dlp) are installed and recipe schema is configured.
  ```bash
  owl-cli doctor
  ```

- **`video`** - Extraction data from video.
  ```bash
  owl-cli video
  ```

For more options:
```bash
owl-cli --help
```