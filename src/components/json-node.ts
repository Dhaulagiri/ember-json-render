import Component from '@glimmer/component';
import {
  evaluateVisibility,
  getByPath,
  resolveBindings,
  resolveElementProps,
  resolveRepeatItemStatePath,
  resolveRepeatStatePath,
  conditionUsesItemScope,
  type PropResolutionContext,
  type Spec,
  type StateStore,
  type UIElement,
} from '@json-render/core';
import type { JsonRenderRegistry } from '../registry';

interface Args {
  elementKey: string;
  spec: Spec;
  registry: JsonRenderRegistry;
  state: Record<string, unknown>;
  store: StateStore;
  emit: (elementKey: string, eventName: string, payload?: unknown) => void;
  loading?: boolean;
  item?: unknown;
  index?: number;
  repeatBasePath?: string;
}

export default class JsonNode extends Component<{ Args: Args }> {
  get element(): UIElement | undefined { return this.args.spec.elements[this.args.elementKey]; }
  get component(): unknown { return this.element ? this.args.registry[this.element.type] : undefined; }
  get children(): string[] { return this.element?.children ?? []; }
  get resolutionContext(): PropResolutionContext {
    return {
      stateModel: this.args.state,
      repeatItem: this.args.item,
      repeatIndex: this.args.index,
      repeatBasePath: this.args.repeatBasePath,
    };
  }
  get props(): Record<string, unknown> { return resolveElementProps(this.element?.props ?? {}, this.resolutionContext); }
  get bindings(): Record<string, string> { return resolveBindings(this.element?.props ?? {}, this.resolutionContext) ?? {}; }
  get containerVisible(): boolean {
    if (this.element?.repeat && conditionUsesItemScope(this.element.visible)) return true;
    return evaluateVisibility(this.element?.visible, this.resolutionContext);
  }
  get visible(): boolean {
    return evaluateVisibility(this.element?.visible, this.resolutionContext);
  }
  get repeated(): unknown[] {
    const repeat = this.element?.repeat;
    if (!repeat) return [];
    const path = resolveRepeatStatePath(repeat.statePath, this.args.repeatBasePath);
    if (!path) return [];
    const value = getByPath(this.args.state, path);
    return Array.isArray(value) ? value : [];
  }
  get repeatPath(): string | undefined {
    const path = this.element?.repeat?.statePath;
    return path ? resolveRepeatStatePath(path, this.args.repeatBasePath) : undefined;
  }
  propsFor = (item: unknown, index: number, repeatBasePath?: string): Record<string, unknown> =>
    resolveElementProps(this.element?.props ?? {}, {
      stateModel: this.args.state,
      repeatItem: item,
      repeatIndex: index,
      repeatBasePath,
    });
  bindingsFor = (item: unknown, index: number, repeatBasePath?: string): Record<string, string> =>
    resolveBindings(this.element?.props ?? {}, {
      stateModel: this.args.state,
      repeatItem: item,
      repeatIndex: index,
      repeatBasePath,
    }) ?? {};
  visibleFor = (item: unknown, index: number): boolean =>
    evaluateVisibility(this.element?.visible, {
      stateModel: this.args.state,
      repeatItem: item,
      repeatIndex: index,
    });
  repeatBaseAt = (index: number): string | undefined =>
    this.repeatPath ? resolveRepeatItemStatePath(this.repeatPath, index) : undefined;
  emit = (name: string, payload?: unknown): void => this.args.emit(this.args.elementKey, name, payload);
  bind = (propName: string, value: unknown): void => {
    const path = this.bindings[propName];
    if (path) this.args.store.set(path, value);
  };
  bindFor = (item: unknown, index: number, repeatBasePath: string | undefined, propName: string, value: unknown): void => {
    const path = this.bindingsFor(item, index, repeatBasePath)[propName];
    if (path) this.args.store.set(path, value);
  };
}
