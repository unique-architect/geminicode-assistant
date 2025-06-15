import * as vscode from 'vscode';
import * as path from 'path';
import { GeminiAPI } from './api';
import { ChatManager } from './chatManager';

let chatView: vscode.WebviewView | undefined;
let chatManager: ChatManager;
let api: GeminiAPI;

export function activate(context: vscode.ExtensionContext) {
  api = new GeminiAPI(context);
  chatManager = new ChatManager(context);

  // Load prompt templates from settings, fallback to default
  let promptTemplates: { name: string; prompt: string }[] =
    vscode.workspace.getConfiguration().get('gemini.promptTemplates') || [
      { name: 'Default', prompt: '' }
    ];

  context.subscriptions.push(
    // API Key Set Command
    vscode.commands.registerCommand('gemini.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        placeHolder: "Enter Google Gemini API Key",
        ignoreFocusOut: true,
        password: true
      });
      if (key) {
        await context.secrets.store('gemini.apiKey', key);
        vscode.window.showInformationMessage("Gemini API key saved securely.");
      }
    }),

    // Inline code generation command
    vscode.commands.registerCommand('gemini.generateCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const pos = editor.selection.active;
      const lineText = doc.lineAt(pos.line).text;

      if (!lineText.trim().startsWith('//gen')) {
        vscode.window.showWarningMessage("Place cursor on line starting with '//gen' to generate code.");
        return;
      }

      const context = doc.getText();
      await sendMessageToApi(
        `Generate code based on this file content:\n${context}\nTrigger: //gen comment line`,
        getCurrentThreadId()
      );
    }),

    // Right click context menu commands for code explanation, refactor, bug fix
    vscode.commands.registerCommand('gemini.explainCode', async () => {
      await processSelectedCodeWithPrefix('Explain this code:');
    }),

    vscode.commands.registerCommand('gemini.refactorCode', async () => {
      await processSelectedCodeWithPrefix('Refactor this code:');
    }),

    vscode.commands.registerCommand('gemini.fixBug', async () => {
      await processSelectedCodeWithPrefix('Fix bugs in this code:');
    }),

    // Start a new chat thread
    vscode.commands.registerCommand('gemini.newThread', () => {
      const thread = chatManager.createThread('New Chat Thread');
      refreshChatView();
      chatManager.setActiveThread(thread.id);
    }),

    // Rename thread command
    vscode.commands.registerCommand('gemini.renameThread', async () => {
      const activeThread = chatManager.getActiveThread();
      if (!activeThread) {
        vscode.window.showWarningMessage('No active chat thread.');
        return;
      }
      const newTitle = await vscode.window.showInputBox({
        prompt: 'Enter new thread title',
        value: activeThread.title,
        ignoreFocusOut: true
      });
      if (newTitle) {
        chatManager.renameThread(activeThread.id, newTitle);
        refreshChatView();
      }
    }),

    // Delete thread command
    vscode.commands.registerCommand('gemini.deleteThread', async () => {
      const activeThread = chatManager.getActiveThread();
      if (!activeThread) {
        vscode.window.showWarningMessage('No active chat thread.');
        return;
      }
      const confirm = await vscode.window.showWarningMessage(`Delete thread "${activeThread.title}"?`, { modal: true }, 'Delete');
      if (confirm === 'Delete') {
        chatManager.deleteThread(activeThread.id);
        refreshChatView();
      }
    }),

    // Command to ask a freeform question
    vscode.commands.registerCommand('gemini.askQuestion', async () => {
      if (!chatManager.getActiveThread()) {
        chatManager.createThread('New Chat Thread');
        refreshChatView();
      }
      const question = await vscode.window.showInputBox({
        prompt: 'Ask a coding question',
        ignoreFocusOut: true
      });
      if (!question) return;
      await sendMessageToApi(question, chatManager.getActiveThread()!.id);
    }),

    // Register Webview View for chat sidebar
    vscode.window.registerWebviewViewProvider('geminiChatSidebar', {
      resolveWebviewView(webviewView: vscode.WebviewView) {
        chatView = webviewView;
        chatView.webview.options = {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview'))]
        };
        chatView.webview.html = getWebviewContent(chatView.webview, context.extensionPath);

        chatView.webview.onDidReceiveMessage(async (message) => {
          switch (message.command) {
            case 'sendMessage':
              await handleSendMessage(message.text, message.threadId, message.promptTemplateName);
              break;
            case 'switchThread':
              chatManager.setActiveThread(message.threadId);
              refreshChatView();
              break;
            case 'newThread':
              {
                const newThread = chatManager.createThread('New Thread');
                refreshChatView();
                chatManager.setActiveThread(newThread.id);
              }
              break;
            case 'deleteThread':
              chatManager.deleteThread(message.threadId);
              refreshChatView();
              break;
            case 'renameThread':
              chatManager.renameThread(message.threadId, message.newTitle);
              refreshChatView();
              break;
            case 'retry':
              await retryLastMessage(message.threadId);
              break;
          }
        });

        refreshChatView();
      }
    }),

    // Register right-click context menu commands
    vscode.commands.registerCommand('gemini.explainCodeContext', () => vscode.commands.executeCommand('gemini.explainCode')),
    vscode.commands.registerCommand('gemini.refactorCodeContext', () => vscode.commands.executeCommand('gemini.refactorCode')),
    vscode.commands.registerCommand('gemini.fixBugContext', () => vscode.commands.executeCommand('gemini.fixBug'))
  );

  async function processSelectedCodeWithPrefix(prefix: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selected = editor.document.getText(editor.selection);
    if (!selected) {
      vscode.window.showWarningMessage('Select code snippet first');
      return;
    }
    if (!chatManager.getActiveThread()) {
      chatManager.createThread('New Chat Thread');
      refreshChatView();
    }
    await sendMessageToApi(`${prefix}\n${selected}`, chatManager.getActiveThread()!.id);
  }

  function getCurrentThreadId(): string {
    let thread = chatManager.getActiveThread();
    if (!thread) {
      thread = chatManager.createThread('New Thread');
      refreshChatView();
      chatManager.setActiveThread(thread.id);
    }
    return thread.id;
  }

  async function sendMessageToApi(text: string, threadId: string, promptTemplateName?: string) {
    const thread = chatManager.getThreads().find(t => t.id === threadId);
    if (!thread) return;

    const promptTemplate = promptTemplateName
      ? promptTemplates.find(t => t.name === promptTemplateName)?.prompt ?? ''
      : '';

    chatManager.addMessageToThread(thread.id, { role: 'user', content: promptTemplate + text });
    refreshChatView();

    chatManager.addMessageToThread(thread.id, { role: 'assistant', content: '' });
    refreshChatView();

    try {
      await api.streamCompletion(
        thread.messages,
        (chunk) => {
          let lastMsg = thread.messages[thread.messages.length - 1];
          if (!lastMsg || lastMsg.role !== 'assistant') {
            lastMsg = { role: 'assistant', content: '' };
            thread.messages.push(lastMsg);
          }
          lastMsg.content += chunk;
          refreshChatView(false);
        },
        () => {
          refreshChatView(false);
        }
      );
    } catch (e) {
      vscode.window.showErrorMessage(`Gemini API error: ${e instanceof Error ? e.message : String(e)}`);
      refreshChatView(false);
    }
  }

  async function handleSendMessage(text: string, threadId: string, promptTemplateName?: string) {
    chatManager.setActiveThread(threadId);
    await sendMessageToApi(text, threadId, promptTemplateName);
  }

  async function retryLastMessage(threadId: string) {
    const thread = chatManager.getThreads().find(t => t.id === threadId);
    if (!thread) return;
    if (thread.messages.length && thread.messages[thread.messages.length - 1].role === 'assistant') {
      thread.messages.pop();
    }
    refreshChatView();

    const lastUserMsg = [...thread.messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    await sendMessageToApi(lastUserMsg.content, threadId);
  }

  function refreshChatView(resetScroll = true) {
    if (!chatView) return;
    const threads = chatManager.getThreads();
    const activeThread = chatManager.getActiveThread();

    chatView.webview.postMessage({
      command: 'refresh',
      threads,
      activeThreadId: activeThread?.id,
      messages: activeThread?.messages || [],
      resetScroll,
      promptTemplates,
    });
  }
}

function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
  const mainScriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'webview', 'main.js')));
  const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'webview', 'style.css')));

  const nonce = getNonce();

  return /*html*/`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
      webview.cspSource
    } 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>Gemini Chat</title>
  </head>
  <body>
    <div id="container">
      <aside id="threadSidebar" role="list"></aside>
      <section id="chatPanel" aria-live="polite">
        <header id="chatHeader">
          <select id="promptTemplateSelector" aria-label="Select prompt template"></select>
          <button id="btnNewThread" aria-label="New thread">New</button>
          <button id="btnRenameThread" aria-label="Rename thread">Rename</button>
          <button id="btnDeleteThread" aria-label="Delete thread">Delete</button>
        </header>
        <main id="messageList" role="log"></main>
        <div id="tokenUsage" aria-live="polite"></div>
        <form id="messageForm" aria-label="Chat input">
          <textarea id="inputArea" rows="3" placeholder="Type your message here..."></textarea>
          <button id="sendBtn" type="submit">Send</button>
          <button id="retryBtn" type="button" hidden title="Retry last message">↻</button>
        </form>
      </section>
    </div>
    <script nonce="${nonce}" src="${mainScriptUri}"></script>
  </body>
  </html>`;
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}
