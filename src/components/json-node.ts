import Component from '@glimmer/component';
import { getByPath, type Spec, type StateStore, type UIElement } from '@json-render/core';
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
}

export default class JsonNode extends Component<{ Args: Args }> {
  get element(): UIElement | undefined { return this.args.spec.elements[this.args.elementKey]; }
  get component(): unknown { return this.element ? this.args.registry[this.element.type] : undefined; }
  get children(): string[] { return this.element?.children ?? []; }
  get props(): Record<string, unknown> {
    const props = { ...(this.element?.props ?? {}) };
    for (const [key, value] of Object.entries(props)) props[key] = this.resolve(value);
    return props;
  }
  get visible(): boolean {
    const condition = this.element?.visible;
    if (condition === undefined || condition === true) return true;
    if (condition === false) return false;
    if (Array.isArray(condition)) return condition.every((part) => this.check(part));
    if (typeof condition === 'object' && condition !== null && '$and' in condition) return condition.$and.every((part) => this.check(part));
    if (typeof condition === 'object' && condition !== null && '$or' in condition) return condition.$or.some((part) => this.check(part));
    return this.check(condition);
  }
  get repeated(): unknown[] {
    const repeat = this.element?.repeat;
    if (!repeat || typeof repeat.statePath !== 'string') return [];
    const value = getByPath(this.args.state, repeat.statePath);
    return Array.isArray(value) ? value : [];
  }
  get repeatPath(): string | undefined {
    const path = this.element?.repeat?.statePath;
    return typeof path === 'string' ? path : undefined;
  }
  private resolve(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.resolve(item));
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.$state === 'string') return getByPath(this.args.state, obj.$state);
      if (typeof obj.$bindState === 'string') return getByPath(this.args.state, obj.$bindState);
      if (typeof obj.$template === 'string') return obj.$template.replace(/\$\{([^}]+)\}/g, (_m, path: string) => String(getByPath(this.args.state, path) ?? ''));
      if ('$cond' in obj) return this.resolve(obj.$cond ? obj.$then : obj.$else);
      return Object.fromEntries(Object.entries(obj).map(([key, child]) => [key, this.resolve(child)]));
    }
    return value;
  }
  private check(condition: unknown): boolean {
    if (!condition || typeof condition !== 'object') return Boolean(condition);
    const c = condition as Record<string, unknown>;
    let value: unknown;
    if (typeof c.$state === 'string') value = getByPath(this.args.state, c.$state);
    else if ('$item' in c) value = c.$item === '' ? this.args.item : (this.args.item as Record<string, unknown> | undefined)?.[String(c.$item)];
    else if ('$index' in c) value = this.args.index;
    else return false;
    let result = 'eq' in c ? value === c.eq : 'neq' in c ? value !== c.neq : 'gt' in c ? Number(value) > Number(c.gt) : 'gte' in c ? Number(value) >= Number(c.gte) : 'lt' in c ? Number(value) < Number(c.lt) : 'lte' in c ? Number(value) <= Number(c.lte) : Boolean(value);
    return c.not === true ? !result : result;
  }
  emit = (name: string, payload?: unknown): void => this.args.emit(this.args.elementKey, name, payload);
  bind = (path: string, value: unknown): void => this.args.store.set(path, value);
}
