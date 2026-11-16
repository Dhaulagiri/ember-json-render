import { tracked } from '@glimmer/tracking';
import { createSpecStreamCompiler, type Spec } from '@json-render/core';

export interface JsonRenderStreamSendOptions {
  /** Optional application data forwarded to the generation endpoint. */
  context?: unknown;
  /** Continue refining an existing spec instead of starting from an empty one. */
  previousSpec?: Spec;
}

export interface JsonRenderUIStreamOptions {
  /** Endpoint that accepts { prompt, context, currentSpec } and returns SpecStream JSONL. */
  api: string;
  /** Supply fetch to add authentication, use a test transport, or route through an app client. */
  fetch?: typeof fetch;
  /** Additional headers sent with each request. */
  headers?: HeadersInit;
  /** Called once with the final spec after a successful stream. */
  onComplete?: (spec: Spec) => void;
}

/**
 * Tracked Ember controller for a json-render SpecStream endpoint.
 * The response body is JSONL containing RFC 6902 patch operations, one per line.
 */
export class JsonRenderUIStream {
  @tracked spec: Spec | null = null;
  @tracked isStreaming = false;
  @tracked error: Error | null = null;

  private activeRequest: AbortController | null = null;
  private readonly request: typeof fetch;

  constructor(private readonly options: JsonRenderUIStreamOptions) {
    this.request = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async send(prompt: string, sendOptions: JsonRenderStreamSendOptions = {}): Promise<void> {
    this.stop();
    const abort = new AbortController();
    this.activeRequest = abort;
    this.error = null;
    this.isStreaming = true;

    const startingSpec = sendOptions.previousSpec ?? undefined;
    this.spec = startingSpec ?? null;
    const compiler = createSpecStreamCompiler<Spec>(startingSpec ?? {});

    try {
      const response = await this.request(this.options.api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(new Headers(this.options.headers).entries()),
        },
        body: JSON.stringify({
          prompt,
          context: sendOptions.context,
          currentSpec: startingSpec,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        throw new Error(`UI generation failed (${response.status} ${response.statusText})`);
      }
      if (!response.body) {
        throw new Error('UI generation response has no readable body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const { result, newPatches } = compiler.push(decoder.decode(value, { stream: true }));
          if (newPatches.length > 0) this.spec = result;
        }
        const remainder = decoder.decode();
        if (remainder) {
          const { result, newPatches } = compiler.push(remainder);
          if (newPatches.length > 0) this.spec = result;
        }
      } finally {
        reader.releaseLock();
      }

      if (abort.signal.aborted) return;
      const finalSpec = compiler.getResult();
      this.spec = finalSpec;
      this.options.onComplete?.(finalSpec);
    } catch (cause) {
      if (!abort.signal.aborted) {
        this.error = cause instanceof Error ? cause : new Error(String(cause));
      }
    } finally {
      if (this.activeRequest === abort) {
        this.activeRequest = null;
        this.isStreaming = false;
      }
    }
  }

  /** Abort the active request and keep any patches already received. */
  stop(): void {
    const active = this.activeRequest;
    if (!active) return;
    this.activeRequest = null;
    this.isStreaming = false;
    active.abort();
  }

  /** Stop generation and reset spec and error state. */
  clear(): void {
    this.stop();
    this.spec = null;
    this.error = null;
  }
}

/** Create a tracked UI stream controller for use from a Glimmer component or service. */
export function createJsonRenderUIStream(options: JsonRenderUIStreamOptions): JsonRenderUIStream {
  return new JsonRenderUIStream(options);
}
