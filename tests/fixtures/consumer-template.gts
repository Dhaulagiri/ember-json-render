import Component from '@glimmer/component';
import { array, hash } from '@ember/helper';
import { JsonChildren, JsonRenderer, defineRegistry, type JsonRenderComponentSignature, type JsonRenderRegistry, type Spec } from 'ember-json-render';
import Renderer from 'ember-json-render/components/json-renderer';

interface CardSignature extends JsonRenderComponentSignature {
  Args: JsonRenderComponentSignature['Args'] & { props: { title?: string } };
}

class Card extends Component<CardSignature> {
  <template>
    <section>
      {{@props.title}}
      {{yield}}
    </section>
  </template>
}

export default class Consumer extends Component {
  registry = defineRegistry({ Card });
  CatalogCard: JsonRenderRegistry[string] = Card;
  spec: Spec = {
    root: 'card',
    elements: { card: { type: 'Card', props: { title: 'Typed template' } } },
  };

  <template>
    <JsonRenderer @spec={{this.spec}} @registry={{this.registry}} />
    <Renderer @spec={{this.spec}} @registry={{this.registry}} @loading={{false}} />
    <this.CatalogCard
      @props={{hash title="Card"}}
      @bindings={{hash}}
      @state={{hash}}
      @children={{array}}
      @emit={{this.emit}}
      @bind={{this.bind}}
    >
      <JsonChildren>Child content</JsonChildren>
    </this.CatalogCard>
    {{! @glint-expect-error: spec is required }}
    <JsonRenderer @registry={{this.registry}} />
    {{! @glint-expect-error: loading must be boolean }}
    <JsonRenderer @spec={{this.spec}} @registry={{this.registry}} @loading="yes" />
  </template>

  emit = (_name: string, _payload?: unknown): void => {};
  bind = (_propName: string, _value: unknown): void => {};
}
