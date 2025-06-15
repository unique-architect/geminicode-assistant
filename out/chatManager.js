"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
class ChatManager {
    constructor(context) {
        this.threads = new Map();
        this.context = context;
        this.loadThreads();
    }
    createThread(title) {
        const id = Date.now().toString();
        const newThread = { id, title, messages: [], lastUpdated: Date.now() };
        this.threads.set(id, newThread);
        this.activeThreadId = id;
        this.saveThreads();
        return newThread;
    }
    getThreads() {
        return Array.from(this.threads.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
    }
    getActiveThread() {
        if (!this.activeThreadId)
            return undefined;
        return this.threads.get(this.activeThreadId);
    }
    setActiveThread(id) {
        if (this.threads.has(id)) {
            this.activeThreadId = id;
            this.saveThreads();
        }
    }
    addMessageToActive(message) {
        const thread = this.getActiveThread();
        if (thread) {
            thread.messages.push(message);
            thread.lastUpdated = Date.now();
            this.saveThreads();
        }
    }
    addMessageToThread(threadId, message) {
        const thread = this.threads.get(threadId);
        if (thread) {
            thread.messages.push(message);
            thread.lastUpdated = Date.now();
            this.saveThreads();
        }
    }
    renameThread(id, newTitle) {
        const thread = this.threads.get(id);
        if (thread) {
            thread.title = newTitle;
            this.saveThreads();
        }
    }
    deleteThread(id) {
        this.threads.delete(id);
        if (this.activeThreadId === id)
            this.activeThreadId = undefined;
        this.saveThreads();
    }
    clearThreads() {
        this.threads.clear();
        this.activeThreadId = undefined;
        this.saveThreads();
    }
    saveThreads() {
        const serializable = {
            activeThreadId: this.activeThreadId,
            threads: Array.from(this.threads.entries()),
        };
        this.context.workspaceState.update('geminiChatThreads', serializable);
    }
    loadThreads() {
        const data = this.context.workspaceState.get('geminiChatThreads');
        if (data) {
            this.activeThreadId = data.activeThreadId;
            this.threads = new Map(data.threads);
        }
    }
}
exports.ChatManager = ChatManager;
//# sourceMappingURL=chatManager.js.map