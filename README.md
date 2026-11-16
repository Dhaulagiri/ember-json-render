# ember-json-render

Ember and Glimmer adapter for [Vercel's json-render](https://github.com/vercel-labs/json-render). It renders the same flat `Spec` shape used by other framework adapters and lets an application map catalog names to ordinary Ember components.

Early preview of an Ember adapter for the shared json-render spec. Catalogs and specs stay portable between framework adapters; the Ember package supplies the renderer and a tracked SpecStream client.

## Install

```sh
npm install ember-json-render @json-render/core
```

This package targets Ember 5/6 and Glimmer components. `@json-render/core` remains the source of the spec, expression, action, and streaming protocol APIs; no forked wire format is introduced.

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

`@onAction` receives `{ name, params, elementKey }`. Supply `@actions` to handle catalog action names. Built-in `setState`, `removeState`, and `pushState` bindings update the renderer's `StateStore`. Supply `@store` to share an upstream store, or `@state` to seed an owned store. Components receive resolved `@props`, `@bindings`, and a `@bind` callback; call `this.args.bind('value', nextValue)` in a component method to write a prop declared with `$bindState` or `$bindItem`.

## Dynamic props

The renderer delegates dynamic prop resolution and visibility evaluation to `@json-render/core`, including `$state`, `$bindState`, `$bindItem`, `$item`, `$index`, templates, conditionals, and nested repeat scopes. Unknown catalog component names are skipped while `@loading` is false and shown as a placeholder while a streamed spec is incomplete.

## Streaming a spec

`createJsonRenderUIStream` is a tracked controller for endpoints that return SpecStream JSONL (RFC 6902 patch lines):

```ts
import { createJsonRenderUIStream } from 'ember-json-render';

ui = createJsonRenderUIStream({ api: '/api/generate' });
// In a component action:
await this.ui.send('A dashboard for weekly sales');
// Refine:
if (this.ui.spec) await this.ui.send('Use a bar chart', { previousSpec: this.ui.spec });
// Stop and keep the partial result: this.ui.stop();
// Clear the current result and error: this.ui.clear();
```

Pass `ui.spec` and `ui.isStreaming` to `<JsonRenderer>`. The controller accepts a custom `fetch`, headers, and an `onComplete` callback. For chat streams, prompts, catalog schemas, validation, and directives, use the corresponding upstream `@json-render/core` APIs alongside this renderer.

## Docs and releases

The `docs/` site is published with GitHub Pages through `.github/workflows/pages.yml`. Add a Changesets file with `pnpm changeset` for each user-facing change. Version packages with `pnpm version-packages`; publishing remains a manual `pnpm release` step through the maintainer's npm trusted publishing setup.

The addon uses Embroider v2 package metadata and Rollup packaging. Its current API is an early preview; consumers should check the docs for the supported surface and current limitations.
