import { ChatMessage } from './api';

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

export class ChatManager {
  private threads: Map<string, ChatThread> = new Map();
  private activeThreadId?: string;
  private context: import('vscode').ExtensionContext;

  constructor(context: import('vscode').ExtensionContext) {
    this.context = context;
    this.loadThreads();
  }

  createThread(title: string): ChatThread {
    const id = Date.now().toString();
    const newThread: ChatThread = { id, title, messages: [], lastUpdated: Date.now() };
    this.threads.set(id, newThread);
    this.activeThreadId = id;
    this.saveThreads();
    return newThread;
  }

  getThreads(): ChatThread[] {
    return Array.from(this.threads.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  getActiveThread(): ChatThread | undefined {
    if (!this.activeThreadId) return undefined;
    return this.threads.get(this.activeThreadId);
  }

  setActiveThread(id: string): void {
    if (this.threads.has(id)) {
      this.activeThreadId = id;
      this.saveThreads();
    }
  }

  addMessageToActive(message: ChatMessage): void {
    const thread = this.getActiveThread();
    if (thread) {
      thread.messages.push(message);
      thread.lastUpdated = Date.now();
      this.saveThreads();
    }
  }

  addMessageToThread(threadId: string, message: ChatMessage): void {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.messages.push(message);
      thread.lastUpdated = Date.now();
      this.saveThreads();
    }
  }

  renameThread(id: string, newTitle: string): void {
    const thread = this.threads.get(id);
    if (thread) {
      thread.title = newTitle;
      this.saveThreads();
    }
  }

  deleteThread(id: string): void {
    this.threads.delete(id);
    if (this.activeThreadId === id) this.activeThreadId = undefined;
    this.saveThreads();
  }

  clearThreads(): void {
    this.threads.clear();
    this.activeThreadId = undefined;
    this.saveThreads();
  }

  private saveThreads(): void {
    const serializable = {
      activeThreadId: this.activeThreadId,
      threads: Array.from(this.threads.entries()),
    };
    this.context.workspaceState.update('geminiChatThreads', serializable);
  }

  private loadThreads(): void {
    const data = this.context.workspaceState.get<{activeThreadId?: string; threads: [string, ChatThread][]}>('geminiChatThreads');
    if (data) {
      this.activeThreadId = data.activeThreadId;
      this.threads = new Map(data.threads);
    }
  }
}
