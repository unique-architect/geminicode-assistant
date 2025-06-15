# GeminiCode Assistant for VSCode

A powerful VSCode extension integrating Google Gemini Pro API to assist you with code explanations, refactoring, bug fixing, inline code generation, and chat-based coding assistance.

---

## Features

- Chat sidebar with full conversation history
- Inline code generation via `//gen` comment trigger
- Right-click editor commands:
  - Explain selected code
  - Refactor selected code
  - Suggest bug fixes for selected code
- Multi-turn Q&A chat with streaming responses
- Token usage display & retry on failure
- Context awareness: includes current file and workspace context
- Dark mode and markdown formatted UI
- Customizable settings and prompt templates support
- Secure API key storage via VSCode Secret Storage

---

## Installation

1. Download the VSIX package: `vsce package` or use the provided `.vsix` file if available.
2. Install via VSCode:  
   - Press `Ctrl+P` (or `Cmd+P` on Mac),  
   - Type: `ext install <path-to-vsix-file>` OR  
   - From command palette: `Extensions: Install from VSIX...`
3. Reload VSCode if necessary.

---

## Configuration

### API Key

You need a valid **Google Gemini Pro API Key**.

- Run command: **Gemini: Set API Key**
- Enter your API key in the prompt (securely stored)

OR add in `settings.json`:

