import * as vscode from 'vscode';
import axios from 'axios';

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
