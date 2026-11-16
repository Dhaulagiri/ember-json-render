import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { createStateStore, executeAction, resolveAction, type ActionHandler, type Spec, type StateStore } from '@json-render/core';
import type { JsonRenderEvent, JsonRenderRegistry } from '../registry';

interface Args {
  spec: Spec;
  registry: JsonRenderRegistry;
  state?: Record<string, unknown>;
  store?: StateStore;
  loading?: boolean;
  onStateChange?: (state: Record<string, unknown>) => void;
  onAction?: (event: JsonRenderEvent) => void | Promise<void>;
  actions?: Record<string, ActionHandler>;
}

export default class JsonRenderer extends Component<{ Args: Args }> {
  @tracked revision = 0;
  private currentStore?: StateStore;
  private unsubscribe?: () => void;
  private seedState?: Record<string, unknown>;
  private usingSuppliedStore = false;

  get store(): StateStore {
    const supplied = this.args.store;
    const seedState = this.args.state ?? this.args.spec.state ?? {};
    const storeChanged = supplied
      ? supplied !== this.currentStore
      : this.usingSuppliedStore || !this.currentStore || seedState !== this.seedState;
    if (storeChanged) {
      this.unsubscribe?.();
      this.seedState = seedState;
      this.currentStore = supplied ?? createStateStore(seedState);
      this.usingSuppliedStore = Boolean(supplied);
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

  emit = async (elementKey: string, eventName: string, payload?: unknown): Promise<void> => {
    const element = this.args.spec.elements[elementKey];
    const binding = element?.on?.[eventName];
    const bindings = Array.isArray(binding) ? binding : binding ? [binding] : [];

    for (const binding of bindings) {
      const action = resolveAction(binding, this.state);
      if (action.action === 'setState' && typeof action.params.statePath === 'string') {
        this.store.set(action.params.statePath, action.params.value);
        continue;
      }
      if (action.action === 'removeState' && typeof action.params.statePath === 'string') {
        // StateStore exposes path writes, so removal currently clears its value.
        this.store.set(action.params.statePath, undefined);
        continue;
      }
      if (action.action === 'pushState' && typeof action.params.statePath === 'string') {
        const path = action.params.statePath;
        const current = this.store.get(path);
        this.store.set(path, [...(Array.isArray(current) ? current : []), action.params.value]);
        continue;
      }
      const handler = this.args.actions?.[action.action];
      if (handler) await executeAction({ action, handler, setState: (path, value) => this.store.set(path, value) });
      await this.args.onAction?.({ name: action.action, params: action.params, elementKey });
    }
    if (bindings.length === 0) await this.args.onAction?.({ name: eventName, params: (payload ?? {}) as Record<string, unknown>, elementKey });
  };

  willDestroy(): void {
    super.willDestroy();
    this.unsubscribe?.();
  }
}
