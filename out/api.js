"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiAPI = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const GEMINI_API_URL = 'https://gemini.googleapis.com/v1/models/latest:chatCompletion';
class GeminiAPI {
    constructor(context) {
        this.context = context;
    }
    async loadApiKey() {
        if (this.apiKey)
            return this.apiKey;
        // Try secret storage first
        this.apiKey = await this.context.secrets.get('gemini.apiKey');
        if (this.apiKey) {
            return this.apiKey;
        }
        // Fallback to workspace config (discouraged but supported)
        this.apiKey = vscode.workspace.getConfiguration().get('gemini.apiKey');
        if (!this.apiKey) {
            throw new Error("Gemini API key is not set. Please run 'Gemini: Set API Key' command.");
        }
        return this.apiKey;
    }
    // Stream Gemini chat completion chunk by chunk
    async streamCompletion(messages, onChunk, onComplete) {
        const apiKey = await this.loadApiKey();
        const payload = {
            model: "gemini-pro-latest",
            messages: messages.map(m => ({
                role: m.role === 'explain' ? 'system' : m.role,
                content: m.content
            })),
            stream: true,
            max_tokens: vscode.workspace.getConfiguration().get('gemini.maxTokens') || 2048,
            temperature: 0.2,
            top_p: 1,
        };
        const headers = {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        try {
            const response = await axios_1.default.post(GEMINI_API_URL, payload, {
                headers,
                responseType: 'stream',
            });
            await new Promise((resolve, reject) => {
                let buffer = '';
                response.data.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // last incomplete line
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
                            }
                            catch {
                                // ignore parse errors in streaming
                            }
                        }
                    }
                });
                response.data.on('end', () => {
                    onComplete();
                    resolve();
                });
                response.data.on('error', (err) => {
                    reject(err);
                });
            });
        }
        catch (err) {
            throw new Error('Failed to connect to Gemini API: ' + (err instanceof Error ? err.message : String(err)));
        }
    }
}
exports.GeminiAPI = GeminiAPI;
//# sourceMappingURL=api.js.map