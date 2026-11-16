import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { createStateStore, type Spec, type StateStore } from '@json-render/core';
import type { JsonRenderEvent, JsonRenderRegistry } from '../registry';

interface Args {
  spec: Spec;
  registry: JsonRenderRegistry;
  state?: Record<string, unknown>;
  store?: StateStore;
  loading?: boolean;
  onStateChange?: (state: Record<string, unknown>) => void;
  onAction?: (event: JsonRenderEvent) => void | Promise<void>;
}

export default class JsonRenderer extends Component<{ Args: Args }> {
  @tracked revision = 0;
  private currentStore?: StateStore;
  private unsubscribe?: () => void;

  get store(): StateStore {
    const supplied = this.args.store;
    if (supplied !== this.currentStore) {
      this.unsubscribe?.();
      this.currentStore = supplied ?? createStateStore(this.args.state ?? this.args.spec.state ?? {});
      this.unsubscribe = this.currentStore.subscribe(() => {
        this.revision++;
        this.args.onStateChange?.(this.currentStore!.getSnapshot());
      });
    }
    return this.currentStore;
  }

  get state(): Record<string, unknown> {
    // Read revision so Glimmer tracks external StateStore updates.
    void this.revision;
    return this.store.getSnapshot();
  }

  emit = (elementKey: string, eventName: string, payload?: unknown): void => {
    const element = this.args.spec.elements[elementKey];
    const binding = element?.on?.[eventName];
    const bindings = Array.isArray(binding) ? binding : binding ? [binding] : [];

    for (const action of bindings) {
      const params = (action.params ?? {}) as Record<string, unknown>;
      if (action.action === 'setState' && typeof params.statePath === 'string') {
        this.store.set(params.statePath, params.value);
      } else if (action.action === 'removeState' && typeof params.statePath === 'string') {
        this.store.set(params.statePath, undefined);
      } else {
        void this.args.onAction?.({ name: action.action, params, elementKey });
      }
    }

    this.args.onAction?.({ name: eventName, params: (payload ?? {}) as Record<string, unknown>, elementKey });
  };

  willDestroy(): void {
    super.willDestroy();
    this.unsubscribe?.();
  }
}
