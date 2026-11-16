# ember-json-render

Ember and Glimmer adapter for [Vercel's json-render](https://github.com/vercel-labs/json-render). It renders the same flat `Spec` shape used by other framework adapters and lets an application map catalog names to ordinary Ember components.

> Early preview: this first cut covers a focused renderer surface (registry, nested children, basic state bindings, visibility, repeat, and action callbacks). It does not yet implement every feature in `@json-render/core` or the broader streaming/chat helpers available in the upstream ecosystem.

## Install

```sh
npm install ember-json-render @json-render/core
```

This package targets Ember 5/6 and Glimmer components. `@json-render/core` remains the source of the spec and catalog types; no forked wire format is introduced.

## Define a registry

Catalog components receive resolved `@props`, `@state`, an `@emit` callback, and children through the yielded block:

```ts
// app/components/ui-card.ts
import Component from '@glimmer/component';

interface Args { props: { title?: string }; }
export default class UiCard extends Component<{ Args: Args }> {}
```

```hbs
{{! app/components/ui-card.hbs }}
<section class="card">
  {{#if @props.title}}<h2>{{@props.title}}</h2>{{/if}}
  {{yield}}
</section>
```

```ts
// app/render-registry.ts
import { defineRegistry } from 'ember-json-render';
import UiCard from './components/ui-card';
import UiButton from './components/ui-button';

export const registry = defineRegistry({ Card: UiCard, Button: UiButton });
```

```hbs
<JsonRenderer @spec={{this.spec}} @registry={{this.registry}} @onAction={{this.handleAction}} />
```

```ts
import type { Spec } from 'ember-json-render';

spec: Spec = {
  root: 'card',
  state: { count: 0 },
  elements: {
    card: { type: 'Card', props: { title: 'Hello' }, children: ['button'] },
    button: {
      type: 'Button', props: { label: 'Increment' },
      on: { press: { action: 'increment', params: { amount: 1 } } },
    },
  },
};
```

`@onAction` receives `{ name, params, elementKey }`. Built-in `setState` and `removeState` action bindings are handled by the renderer. Supply `@store` to share an upstream `StateStore`, or `@state` to seed an owned store. Components can receive `@bind` and call it with a JSON Pointer path to update state.

## Dynamic props

The initial adapter resolves literals, `$state`, `$bindState`, `$template`, and `$cond` objects. Visibility and repeated arrays are supported for common cases. Unknown catalog component names are skipped while `@loading` is false and shown as a small placeholder while a streamed spec is incomplete.

For catalog schemas, prompts, full expression/directive support, and SpecStream parsing, use the upstream `@json-render/core` APIs directly. The Ember adapter is intentionally a framework renderer, not a reimplementation of core.

## Status

The workspace is a source starter and has not been built against a generated Ember app yet. The addon API and packaging need verification against the consuming app's exact Ember CLI / Embroider setup before publishing.
