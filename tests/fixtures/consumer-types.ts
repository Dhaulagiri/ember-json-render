import '@glint/environment-ember-template-imports';
import Component from '@glimmer/component';
import type { ComponentLike } from '@glint/template';
import { createStateStore } from '@json-render/core';
import {
  JsonChildren,
  JsonNode,
  JsonRenderer,
  JsonRenderUIStream,
  createJsonRenderUIStream,
  defineRegistry,
  type JsonRenderComponentArgs,
  type JsonRenderComponentSignature,
  type JsonRenderEvent,
  type JsonRenderRegistry,
  type JsonRenderStreamSendOptions,
  type JsonRenderUIStreamOptions,
  type Spec,
  type StateStore,
  type UIElement,
} from 'ember-json-render';
import Renderer from 'ember-json-render/components/json-renderer';
import Node from 'ember-json-render/components/json-node';
import Children from 'ember-json-render/components/json-children';
import { defineRegistry as defineSubpathRegistry } from 'ember-json-render/registry';
import { createJsonRenderUIStream as createSubpathStream } from 'ember-json-render/streaming';

class Card extends Component<JsonRenderComponentSignature> {
  update(value: unknown): void {
    this.args.bind('value', value);
    this.args.emit('press', { value });
    const item: unknown = this.args.item;
    const index: number | undefined = this.args.index;
    const args: JsonRenderComponentArgs = this.args;
    void [item, index, args];
  }
}

const registry = defineRegistry({ Card });
const catalog: JsonRenderRegistry = defineSubpathRegistry(registry);
const original: typeof Card = registry.Card;
const renderer: typeof JsonRenderer = Renderer;
const node: typeof JsonNode = Node;
const children: typeof JsonChildren = Children;
const component: ComponentLike<JsonRenderComponentSignature> = Card;
const marker: ComponentLike<{ Args: { slot?: string }; Blocks: { default: [] } }> = JsonChildren;
const element: UIElement = { type: 'Card', props: { title: 'Typed consumer' } };
const spec: Spec = { root: 'card', elements: { card: element } };
const rendererArgs: JsonRenderer['args'] = {
  spec,
  registry,
  onAction(event: JsonRenderEvent) {
    const name: string = event.name;
    const params: Record<string, unknown> = event.params;
    const key: string = event.elementKey;
    void [name, params, key];
  },
};
const nodeArgs: JsonNode['args'] = {
  elementKey: 'card',
  spec,
  registry,
  state: {},
  store: createStateStore({}),
  emit: () => {},
};
const store: StateStore = nodeArgs.store;
const options: JsonRenderUIStreamOptions = { api: '/generate', onComplete: (result: Spec) => void result };
const sendOptions: JsonRenderStreamSendOptions = { previousSpec: spec };
const stream: JsonRenderUIStream = createJsonRenderUIStream(options);
const subpathStream: JsonRenderUIStream = createSubpathStream(options);
const send: (prompt: string, options?: JsonRenderStreamSendOptions) => Promise<void> = stream.send;

// @ts-expect-error A registry value must be a component, not an arbitrary value.
defineRegistry({ Invalid: 123 });
// @ts-expect-error Renderer specs must have the upstream Spec shape.
const invalidSpec: JsonRenderer['args']['spec'] = 'not a spec';
// @ts-expect-error Action names are strings.
const invalidEvent: JsonRenderEvent = { name: 123, params: {}, elementKey: 'card' };
// @ts-expect-error The generated component declaration must preserve argument types.
const invalidSlot: JsonChildren['args']['slot'] = 123;
// @ts-expect-error Recursive node keys must be strings.
const invalidKey: JsonNode['args']['elementKey'] = 123;
// @ts-expect-error Stream endpoints are strings.
createJsonRenderUIStream({ api: 123 });

void [catalog, original, renderer, node, children, component, marker, rendererArgs, nodeArgs, store,
  sendOptions, subpathStream, send, invalidSpec, invalidEvent, invalidSlot, invalidKey];
