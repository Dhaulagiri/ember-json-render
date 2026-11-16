import type { ComponentLike } from '@glint/template';

export interface JsonRenderEvent {
  name: string;
  params: Record<string, unknown>;
  elementKey: string;
}

export interface JsonRenderComponentArgs {
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  emit: (eventName: string, payload?: unknown) => void;
  children: string[];
}

export type JsonRenderRegistry = Record<string, ComponentLike<JsonRenderComponentArgs>>;

export function defineRegistry<T extends JsonRenderRegistry>(registry: T): T {
  return registry;
}
