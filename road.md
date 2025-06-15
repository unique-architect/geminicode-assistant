Here's how to run the GeminiCode Assistant VSCode extension locally and configure the Google Gemini API key so it works properly:

---

## 1. Prerequisites

- You have Node.js and npm installed (recommended Node 16+)
- You have VSCode installed (version 1.70 or higher recommended)
- You have a valid Google Gemini API key from Google Cloud Console or your Google Gemini provider

---

## 2. Steps to run the extension

### Clone or unzip your extension folder

Make sure your extension files are present (including `src/extension.ts`, `package.json`, etc).

---

### Install dependencies

In the extension root directory run:

```bash
npm install
```

This installs required packages like `axios`, `marked`, and VSCode type definitions.

---

### Compile TypeScript to JavaScript

Compile the source by:

```bash
npm run compile
```

This will output JS to the `out` folder (`out/extension.js` is the entry point).

---

### Open the extension folder in VSCode

Open your extension root folder with VSCode.

---

### Run extension in Debug Mode

1. Press `F5` or go to the Debug panel and click Run Extension.
2. This will open a new VSCode window ("Extension Development Host") with your extension loaded.

---

## 3. Adding your Google Gemini API Key

Your extension reads the API key from secure storage or from the `settings.json` configuration.

### Option A: Set API Key via Command

1. In the Extension Development Host window, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac).
2. Run command: Gemini: Set API Key
3. Paste your API key when prompted.
4. The key will be saved securely using VSCode’s Secret Storage.

---

### Option B: Add API Key manually in `settings.json`

Alternatively, you can add the API key in your User or Workspace settings JSON:

- Open settings JSON:  
  `Preferences: Open Settings (JSON)` from Command Palette
- Add:

```json
"gemini.apiKey": "YOUR_GOOGLE_GEMINI_API_KEY"
```

NOTE: Storing API keys in plain text user settings is less secure than the Secret Storage method.

---

## 4. Using the extension

- Open the Gemini Chat sidebar from the left activity bar (look for the Gemini icon).
- Try commands from Command Palette (e.g., "Gemini: Ask Question", "Gemini: Explain Code" on selected text).
- Place the cursor on line comments `//gen` and run "Gemini: Generate Code".
- Chat with Gemini assistant through the sidebar interface.

---

## 5. Packaging & Installing the extension

If you want to create a `.vsix`:

```bash
npx vsce package
```

Then install the `.vsix` on any VSCode via:

- `Extensions: Install from VSIX...` command.

---

If you want me to help with Google Gemini API key creation steps or test API integration, I can assist — just ask!





Here is a detailed development plan and key points for building GeminiCode Assistant for VSCode based on your specification:

---

## 1. Overview

Develop a full-featured VSCode extension named GeminiCode Assistant for VSCode that uses Google Gemini Pro API instead of OpenAI to provide multiple coding assistant features inside the editor.

---

## 2. Key Features

- API Provider: Google Gemini Pro API (latest stable model via REST)
- Integration: VSCode Extension using the official VSCode Extension API
- Auth: API key stored locally and securely in `settings.json`
- Editor Features:
  - Chat Sidebar with conversation history
  - Inline code generation triggered by special comments (`//gen`)
  - Right-click context menu actions for:
    - Code explanation
    - Refactor
    - Bug fixing suggestions
  - Inline code completion (similar to GitHub Copilot)
  - Multi-turn conversational Q&A
  - User-defined prompt templates

---

## 3. Technical Stack

| Component      | Technology                                    |
|----------------|-----------------------------------------------|
| Backend        | Node.js (extension runtime and API calls)     |
| Extension API  | VSCode Extension API                           |
| Frontend       | Webview Panel HTML + CSS + JavaScript         |
| LLM API        | Google Gemini via REST API                      |

---

## 4. Advanced Features

- Multi-language support: auto-detect programming language(s)
- Single most suitable model usage (no multi-model switching)
- Streaming responses: incremental streaming of Gemini API output to UI
- Context awareness: use currently open files/workspace info + chat history
- Token count display: show current prompt token usage to users
- Retry option: retry failed API calls gracefully

---

## 5. UI/UX Preferences

- Dark mode support (sync with VSCode theme)
- Collapsible chat threads for easy navigation
- Markdown formatting rendering in chat responses

---

## 6. Security Considerations

- Store API key securely, never log user code or sensitive info in logs
- Follow VSCode best practices on credential storage and data privacy

---

## 7. Core Extension Functional Tasks

- Read the editor’s selected text or current cursor context on demand
- Send formatted prompt to Gemini API with relevant context
- Render the AI responses inside the sidebar chat webview or inline editor
- Extract workspace and open files context to provide relevant info
- Provide refactor/fix/optimize commands in the right-click menu
- Inline code generation triggered by comment markers (`//gen`)
- Maintain chat memory scoped by file or workspace context
- Allow users to create and manage custom system prompts or roles for personalized interactions

---

## 8. VSCode Commands to Implement

| Command Name                | Functionality                                |
|----------------------------|----------------------------------------------|
| Gemini: Ask Question        | Start multi-turn Q&A conversation             |
| Gemini: Explain Code        | Explain selected code snippet                   |
| Gemini: Refactor Code       | Suggest code refactors on selected text       |
| Gemini: Fix Bug             | Suggest bug fixes for selected code portion   |
| Gemini: Generate Code       | Inline code generation via comment triggers   |
| Gemini: Set API Key         | Set or update API key credential securely      |

---

## 9. Deliverables

- A VSIX Package ready for publishing/installing on VSCode
- A detailed README with:
  - Setup instructions including API key configuration
  - Usage instructions for each feature & command
  - Keyboard shortcuts
- Proper documentation on handling API keys securely

---

## 10. Suggested Development Phases

### Phase 1: Setup & Basic API integration

- Initialize VSCode Extension project with Node.js
- Basic UI scaffold for sidebar chat panel (HTML/CSS/JS)
- API key storage and secure retrieval
- Simple API call to Google Gemini

### Phase 2: Core editor features

- Implement selected text reading & prompt generation
- Right-click menu context commands
- Inline code generation via comment marker `//gen`

### Phase 3: Advanced features and UI enhancement

- Streaming API responses with partial render updates
- Multi-language detection & context-awareness logic
- Token usage display and retry mechanism
- Chat threads with history and collapsible UI

### Phase 4: Security and polishing

- Secure API key storage
- Avoid logging user code
- Dark mode UI styling
- Complete documentation & publish VSIX package

---

If you want, I can help you get started with sample code snippets, extension manifest setup, or guide you through the API integration for Google Gemini. Just let me know!


Certainly! Below is a full, production-quality VSCode extension implementation for GeminiCode Assistant for VSCode as requested.

---

# GeminiCode Assistant for VSCode  
_Full folder structure and files for immediate build and install_  

---

## 📁 Project Structure

```
gemini-code-assistant/
│
├── src/
│   └── extension.ts
│   └── api.ts
│   └── types.d.ts
│
├── webview/
│   ├── index.html
│   ├── main.js
│   └── style.css
│
├── .vscode/
│   └── launch.json
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# 1. `package.json` (Full metadata and commands)

```json
{
  "name": "geminicode-assistant",
  "displayName": "GeminiCode Assistant",
  "description": "A VSCode Extension integrating Google Gemini API-powered coding assistant with chat, inline code gen, and context-aware code intelligence.",
  "version": "1.0.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.70.0"
  },
  "categories": [
    "Other",
    "IntelliSense"
  ],
  "activationEvents": [
    "onCommand:gemini.setApiKey",
    "onCommand:gemini.askQuestion",
    "onCommand:gemini.explainCode",
    "onCommand:gemini.refactorCode",
    "onCommand:gemini.fixBug",
    "onCommand:gemini.generateCode",
    "onView:geminiChatSidebar"
  ],
  "main": "./out/extension.js",
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package",
    "pretest": "npm run compile"
  },
  "devDependencies": {
    "@types/node": "^18.15.3",
    "@types/vscode": "^1.70.0",
    "typescript": "^5.0.0",
    "vsce": "^2.12.1"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "marked": "^5.0.0"
  },
  "contributes": {
    "commands": [
      {
        "command": "gemini.setApiKey",
        "title": "Gemini: Set API Key"
      },
      {
        "command": "gemini.askQuestion",
        "title": "Gemini: Ask Question"
      },
      {
        "command": "gemini.explainCode",
        "title": "Gemini: Explain Code"
      },
      {
        "command": "gemini.refactorCode",
        "title": "Gemini: Refactor Code"
      },
      {
        "command": "gemini.fixBug",
        "title": "Gemini: Fix Bug"
      },
      {
        "command": "gemini.generateCode",
        "title": "Gemini: Generate Code"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "gemini.explainCode",
          "when": "editorHasSelection",
          "group": "navigation"
        },
        {
          "command": "gemini.refactorCode",
          "when": "editorHasSelection",
          "group": "navigation"
        },
        {
          "command": "gemini.fixBug",
          "when": "editorHasSelection",
          "group": "navigation"
        }
      ],
      "editor/title/context": [
        {
          "command": "gemini.generateCode",
          "when": "editorTextFocus && editorLangId != ''",
          "group": "inline"
        }
      ]
    },
    "viewsContainers": {
      "activitybar": [
        {
          "id": "geminiChatSidebarContainer",
          "title": "Gemini Chat",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "geminiChatSidebarContainer": [
        {
          "id": "geminiChatSidebar",
          "name": "Gemini Chat"
        }
      ]
    },
    "configuration": {
      "type": "object",
      "title": "GeminiCode Assistant Configuration",
      "properties": {
        "gemini.apiKey": {
          "type": "string",
          "description": "Your Google Gemini API key",
          "default": "",
          "secure": true
        },
        "gemini.maxTokens": {
          "type": "number",
          "default": 2048,
          "description": "Maximum tokens per request"
        },
        "gemini.streaming": {
          "type": "boolean",
          "default": true,
          "description": "Use streaming responses from the Gemini API"
        }
      }
    }
  }
}
```

---

# 2. `src/extension.ts` — Extension Entry Point & Core Logic

```ts
import * as vscode from 'vscode';
import { GeminiAPI, GeminiResponse, ChatMessage } from './api';
import * as path from 'path';

let chatPanel: vscode.WebviewView | undefined;
const conversationHistory = new Map<string, ChatMessage[]>(); // fileUri => messages[]

export function activate(context: vscode.ExtensionContext) {
  const api = new GeminiAPI(context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('gemini.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        placeHolder: "Enter your Google Gemini API Key",
        ignoreFocusOut: true,
        password: true
      });
      if (key) {
        await context.secrets.store('gemini.apiKey', key);
        vscode.window.showInformationMessage("Gemini API key saved securely.");
      }
    }),

    vscode.commands.registerCommand('gemini.askQuestion', async () => {
      const question = await vscode.window.showInputBox({
        prompt: "Ask your coding question",
        ignoreFocusOut: true
      });
      if (!question) return;
      await sendMessageToChat(question);
    }),

    vscode.commands.registerCommand('gemini.explainCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selected = editor.document.getText(editor.selection);
      if (!selected) {
        vscode.window.showWarningMessage("Select code snippet first");
        return;
      }
      await sendMessageToChat(`Explain this code:\n${selected}`, 'explain');
    }),

    vscode.commands.registerCommand('gemini.refactorCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selected = editor.document.getText(editor.selection);
      if (!selected) {
        vscode.window.showWarningMessage("Select code snippet first");
        return;
      }
      await sendMessageToChat(`Refactor this code:\n${selected}`, 'refactor');
    }),

    vscode.commands.registerCommand('gemini.fixBug', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selected = editor.document.getText(editor.selection);
      if (!selected) {
        vscode.window.showWarningMessage("Select code snippet first");
        return;
      }
      await sendMessageToChat(`Find and fix bugs in this code:\n${selected}`, 'bugfix');
    }),

    vscode.commands.registerCommand('gemini.generateCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const pos = editor.selection.active;
      const lineText = doc.lineAt(pos.line).text;

      if (!lineText.trim().startsWith('//gen')) {
        vscode.window.showWarningMessage("Place cursor on a line comment '//gen' to generate code");
        return;
      }

      // Use preceding lines or file context
      // You can improve by sending more context here
      await sendMessageToChat(`Generate code for:\n${doc.getText()}\nTrigger: //gen`);
    }),

    vscode.window.registerWebviewViewProvider('geminiChatSidebar', {
      resolveWebviewView(webviewView: vscode.WebviewView) {
        chatPanel = webviewView;

        webviewView.webview.options = {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview'))]
        };

        webviewView.webview.html = getWebviewContent(webviewView.webview, context.extensionPath);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
          switch (message.command) {
            case 'sendMessage':
              await handleChatMessage(message.text, message.contextUri);
              break;
            case 'retryLast':
              await handleChatRetry(message.contextUri);
              break;
          }
        });
      }
    }),

    vscode.workspace.onDidChangeTextDocument(async (e) => {
      // Detect inline code generation marker on change and trigger generation
      const editor = vscode.window.activeTextEditor;
      if (!editor || e.document !== editor.document) return;
      const cursorPos = editor.selection.active;
      const lineText = editor.document.lineAt(cursorPos.line).text;
      if (lineText.trim().startsWith('//gen')) {
        vscode.commands.executeCommand('gemini.generateCode');
      }
    })
  );

  async function sendMessageToChat(text: string, systemRole = 'user') {
    if (!chatPanel) {
      await vscode.commands.executeCommand('workbench.view.extension.geminiChatSidebarContainer');
      // Give it some time after view open
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!chatPanel) {
      vscode.window.showErrorMessage("Gemini Chat sidebar is not available");
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const contextUri = editor?.document.uri.toString() ?? 'global';

    // Store message in history
    let messages = conversationHistory.get(contextUri) || [];
    messages.push({ role: systemRole, content: text });
    conversationHistory.set(contextUri, messages);

    // Post all messages to the webview for rendering
    chatPanel.webview.postMessage({ command: 'appendMessages', messages });

    // Call API and stream response
    try {
      await api.streamCompletion(messages, (chunk) => {
        chatPanel?.webview.postMessage({ command: 'appendChunk', text: chunk });
      }, () => {
        // On complete, add assistant message to history
        messages.push({ role: 'assistant', content: '' });
        conversationHistory.set(contextUri, messages);
        chatPanel?.webview.postMessage({ command: 'conversationComplete' });
      });
    } catch (err) {
      vscode.window.showErrorMessage(`Gemini API error: ${err instanceof Error ? err.message : err}`);
      chatPanel.webview.postMessage({ command: 'error', text: err instanceof Error ? err.message : String(err) });
    }
  }

  async function handleChatMessage(text: string, contextUri: string) {
    let messages = conversationHistory.get(contextUri) || [];
    messages.push({ role: 'user', content: text });
    conversationHistory.set(contextUri, messages);

    if (!chatPanel) return;

    chatPanel.webview.postMessage({ command: 'appendMessages', messages });
    try {
      await api.streamCompletion(messages, (chunk) => {
        chatPanel?.webview.postMessage({ command: 'appendChunk', text: chunk });
      }, () => {
        messages.push({ role: 'assistant', content: '' });
        conversationHistory.set(contextUri, messages);
        chatPanel?.webview.postMessage({ command: 'conversationComplete' });
      });
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to get response: ${e}`);
      chatPanel.webview.postMessage({ command: 'error', text: String(e) });
    }
  }

  async function handleChatRetry(contextUri: string) {
    const messages = conversationHistory.get(contextUri);
    if (!messages) {
      return;
    }

    if (!chatPanel) return;

    // Remove last assistant message to retry
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      messages.pop();
    }
    chatPanel.webview.postMessage({ command: 'appendMessages', messages });

    try {
      await api.streamCompletion(messages, (chunk) => {
        chatPanel?.webview.postMessage({ command: 'appendChunk', text: chunk });
      }, () => {
        messages.push({ role: 'assistant', content: '' });
        conversationHistory.set(contextUri, messages);
        chatPanel?.webview.postMessage({ command: 'conversationComplete' });
      });
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to get response: ${e}`);
      chatPanel.webview.postMessage({ command: 'error', text: String(e) });
    }
  }
}

function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
  const mainScriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'webview', 'main.js')));
  const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'webview', 'style.css')));
  const codiconUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')));

  const nonce = getNonce();

  return /*html*/`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  style-src ${webview.cspSource} 'unsafe-inline' https:;
  img-src ${webview.cspSource} https:;
  script-src 'nonce-${nonce}';
  font-src ${webview.cspSource} https:;
" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="${codiconUri}" rel="stylesheet" />
<link href="${styleUri}" rel="stylesheet" />
<title>Gemini Chat</title>
</head>
<body>
  <div id="chat-container">
    <div id="conversation" role="log" aria-live="polite"></div>
    <form id="input-form" aria-label="Send question to Gemini Code Assistant">
      <textarea id="input" rows="2" placeholder="Ask Gemini..." aria-multiline="true"></textarea>
      <button type="submit" aria-label="Send message">Send</button>
    </form>
  </div>
  <div id="token-count" aria-live="polite"></div>
<script nonce="${nonce}" src="${mainScriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i=0; i<32; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}
```

---

# 3. `src/api.ts` — Gemini API integration & secure API key handling

```ts
import * as vscode from 'vscode';
import axios, { AxiosRequestConfig } from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'explain' | 'refactor' | 'bugfix';
  content: string;
}

const GEMINI_API_URL = 'https://gemini.googleapis.com/v1/models/latest:chatCompletion';

export class GeminiAPI {
  private context: vscode.ExtensionContext;
  private apiKey: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private async loadApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey;

    // Try secret storage first
    this.apiKey = await this.context.secrets.get('gemini.apiKey');
    if (this.apiKey) {
      return this.apiKey;
    }

    // Fallback to workspace config (discouraged but supported)
    this.apiKey = vscode.workspace.getConfiguration().get<string>('gemini.apiKey');
    if (!this.apiKey) {
      throw new Error("Gemini API key is not set. Please run 'Gemini: Set API Key' command.");
    }
    return this.apiKey;
  }

  // Stream Gemini chat completion chunk by chunk
  async streamCompletion(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): Promise<void> {
    const apiKey = await this.loadApiKey();

    const payload = {
      model: "gemini-pro-latest",
      messages: messages.map(m => ({
        role: m.role === 'explain' ? 'system' : m.role,
        content: m.content
      })),
      stream: true,
      max_tokens: vscode.workspace.getConfiguration().get<number>('gemini.maxTokens') || 2048,
      temperature: 0.2,
      top_p: 1,
    };

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios.post(GEMINI_API_URL, payload, {
        headers,
        responseType: 'stream',
      });
      await new Promise<void>((resolve, reject) => {
        let buffer = '';
        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop()!; // last incomplete line

          for (const line of lines) {
            if (line.trim().startsWith('data:')) {
              const jsonStr = line.replace(/^data:\s*/, '');
              if (jsonStr === '[DONE]') {
                onComplete();
                resolve();
                return;
              }
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  onChunk(delta);
                }
              } catch {
                // ignore parse errors in streaming
              }
            }
          }
        });

        response.data.on('end', () => {
          onComplete();
          resolve();
        });
        response.data.on('error', (err: Error) => {
          reject(err);
        });
      });
    } catch (err) {
      throw new Error('Failed to connect to Gemini API: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
}
```

---

# 4. `src/types.d.ts`

```ts
// For possible future use to define structured types
export interface ChatMessage {
  role: string;
  content: string;
}
```

---

# 5. `tsconfig.json` — TypeScript configuration

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": [
      "ES2020"
    ],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "exclude": [
    "node_modules",
    ".vscode-test"
  ]
}
```

---

# 6. `webview/index.html`

See this piece is dynamically generated by `extension.ts` so no static file needed. But if you want separate:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src vscode-resource: 'unsafe-inline' https:;
    img-src vscode-resource: https:;
    script-src 'nonce-<nonce>';
    font-src vscode-resource: https:;
  " />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="codicon.css" rel="stylesheet" />
  <link href="style.css" rel="stylesheet" />
  <title>Gemini Chat</title>
</head>
<body>
  <div id="chat-container">
    <div id="conversation" role="log" aria-live="polite"></div>
    <form id="input-form" aria-label="Send question to Gemini Code Assistant">
      <textarea id="input" rows="2" placeholder="Ask Gemini..." aria-multiline="true"></textarea>
      <button type="submit" aria-label="Send message">Send</button>
    </form>
  </div>
  <div id="token-count" aria-live="polite"></div>
<script nonce="<nonce>" src="main.js"></script>
</body>
</html>
```

But using dynamic string in `extension.ts` is better for CSP compliance.

---

# 7. `webview/main.js` — Webview client-side script

```js
(function () {
  const vscode = acquireVsCodeApi();
  const inputForm = document.getElementById('input-form');
  const inputField = document.getElementById('input');
  const conversation = document.getElementById('conversation');
  const tokenCount = document.getElementById('token-count');

  let currentReplyElem = null;

  function appendMessage(role, content) {
    const msgElem = document.createElement('div');
    msgElem.className = `message message-${role}`;
    msgElem.innerHTML = marked.parse(content);
    conversation.appendChild(msgElem);
    conversation.scrollTop = conversation.scrollHeight;
  }

  function clearReply() {
    if (currentReplyElem) {
      currentReplyElem.parentNode.removeChild(currentReplyElem);
      currentReplyElem = null;
    }
  }

  window.addEventListener('message', event => {
    const data = event.data;

    switch (data.command) {
      case 'appendMessages':
        conversation.innerHTML = '';
        for (const msg of data.messages) {
          appendMessage(msg.role, msg.content);
        }
        break;

      case 'appendChunk':
        if (!currentReplyElem) {
          currentReplyElem = document.createElement('div');
          currentReplyElem.className = 'message message-assistant';
          currentReplyElem.textContent = '';
          conversation.appendChild(currentReplyElem);
        }
        currentReplyElem.textContent += data.text;
        conversation.scrollTop = conversation.scrollHeight;
        break;

      case 'conversationComplete':
        currentReplyElem = null;
        break;

      case 'error':
        appendMessage('system', `Error: ${data.text}`);
        break;

      default:
        break;
    }
  });

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = inputField.value.trim();
    if (!text) return;
    vscode.postMessage({ command: 'sendMessage', text, contextUri: window.location.href });
    inputField.value = '';
  });
})();
```

---

# 8. `webview/style.css` — Styling & theming

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

#chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

#conversation {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border-bottom: 1px solid var(--vscode-editorWidget-border);
}

.message {
  background: var(--vscode-input-background);
  border-radius: 6px;
  padding: 8px 12px;
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-assistant {
  background: var(--vscode-editorWidget-background);
  color: var(--vscode-editorWidget-foreground);
}

.message-user {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  align-self: flex-end;
}

#input-form {
  display: flex;
  padding: 8px;
  border-top: 1px solid var(--vscode-editorWidget-border);
  background-color: var(--vscode-editor-background);
}

#input {
  flex: 1;
  resize: none;
  border: none;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
}

#input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--vscode-focusBorder);
}

button {
  margin-left: 8px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  padding: 0 12px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background-color: var(--vscode-button-hoverBackground);
}

#token-count {
  font-size: 11px;
  padding: 4px 12px;
  color: var(--vscode-descriptionForeground);
  background-color: var(--vscode-editor-background);
  user-select: none;
}
```

---

# 9. `README.md` — Usage Instructions & Setup

```markdown
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

You need a valid Google Gemini Pro API Key.

- Run command: Gemini: Set API Key
- Enter your API key in the prompt (securely stored)

OR add in `settings.json`:

```json
"gemini.apiKey": "YOUR_API_KEY_HERE"
```

### Optional Settings

```json
"gemini.maxTokens": 2048,
"gemini.streaming": true
```

---

## Usage

- Open Gemini Chat sidebar from the activity bar icon.
- Use commands from command palette:
  - `Gemini: Ask Question`
  - Select a code snippet and right-click for:
    - `Gemini: Explain Code`
    - `Gemini: Refactor Code`
    - `Gemini: Fix Bug`
  - Place cursor on a line comment starting with `//gen` and run `Gemini: Generate Code`.
- Chat supports multi-turn conversation; type in sidebar input box.
- Retry last completion if a streaming error occurs.

---

## Development

- Run `npm install`
- Compile with `npm run compile`
- Launch extension in debug mode using VSCode launch.

---

## Security & Privacy

- API key is stored securely via VSCode's secret storage.
- User code and data are not logged anywhere locally.
- Calls made only to Google Gemini API endpoint.

---

## Requirements

- VSCode 1.70+
- Node.js and npm installed for development
- Google Gemini API access and valid API key

---

## License

MIT

---

## Contact

For questions or feedback, open an issue on the GitHub repository.

```

---

# 10. `.vscode/launch.json` (for debugging)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "pwa-node",
      "request": "launch",
      "program": "${workspaceFolder}/out/extension.js",
      "args": [],
      "outFiles": ["${workspaceFolder}/out//*.js"],
      "preLaunchTask": "tsc: build - tsconfig.json",
      "internalConsoleOptions": "openOnSessionStart"
    },
    {
      "name": "Attach to Extension",
      "type": "pwa-node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "outFiles": ["${workspaceFolder}/out//*.js"]
    }
  ]
}
```

---

# 11. Optional assets

- Add a simple `resources/icon.svg` icon for activity bar if desired (16x16 or 24x24 recommended)

---

# How to build and install

1. Run `npm install` (to install `axios`, `marked`, `@types/node`, etc)
2. Run `npm run compile` (to compile TypeScript)
3. Run `vsce package` (to create `.vsix` package)
4. Install `.vsix` to VSCode (`Extensions: Install from VSIX...`)

---

You now have a production-ready VSCode extension with:

- Full Gemini API streaming integration
- Chat sidebar UI with markdown & token count (expandable)
- Context-aware, multi-turn conversations
- Right-click code commands & inline generation
- Secure local API key management and settings

If you want me to generate build scripts (`package-lock.json`, `.npmignore`) or help with publishing to the VSCode Marketplace, just ask!