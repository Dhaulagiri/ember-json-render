import Application from '@ember/application';
import Controller from '@ember/controller';
import Router from '@ember/routing/router';
import { getComponentTemplate, setComponentTemplate } from '@ember/component';
import templateOnly from '@ember/component/template-only';
import { precompileTemplate } from '@ember/template-compilation';
import { createStateStore } from '@json-render/core';
import { JsonRenderer, JsonNode, JsonChildren, defineRegistry } from 'ember-json-render';
import { registerAppComponents } from './app-components.js';

const Card = setComponentTemplate(
  precompileTemplate('<section data-test-card><h1>{{@props.title}}</h1>{{yield}}</section>'),
  templateOnly(),
);
const Text = setComponentTemplate(
  precompileTemplate('<p data-test-text>{{@props.text}}</p>'),
  templateOnly(),
);
const store = createStateStore({ title: 'Packed renderer', items: [{ label: 'First' }, { label: 'Second' }] });
const spec = {
  root: 'card',
  elements: {
    card: { type: 'Card', props: { title: { $state: '/title' } }, children: ['text'] },
    text: { type: 'Text', repeat: { statePath: '/items' }, props: { text: { $item: 'label' } } },
  },
};

const app = Application.create({
  autoboot: false,
  rootElement: '#fixture',
  Resolver: { create: () => ({ resolve() {} }) },
});
app.register('router:main', Router.extend({ location: 'none' }));
app.register('controller:application', Controller.extend({
  spec,
  store,
  registry: defineRegistry({ Card, Text }),
}));
app.register('template:application', precompileTemplate(`
  <JsonRenderer @spec={{this.spec}} @registry={{this.registry}} @store={{this.store}} />
`));
registerAppComponents(app);

window.consumer = {
  ready: app.visit('/'),
  hasTemplates: [JsonRenderer, JsonNode, JsonChildren].map((component) => Boolean(getComponentTemplate(component))),
  updateTitle: () => store.set('/title', 'Updated from store'),
  destroy: () => app.destroy(),
};
