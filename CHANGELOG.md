# ember-json-render

## 0.2.2

### Patch Changes

- 8731593: Generate and publish TypeScript declarations with type-aware root and subpath exports. Correct catalog component signatures to include the yielded default block and export `JsonRenderComponentSignature` for use by catalog components, so TypeScript and Glint consumers no longer need local addon declaration shims.

## 0.2.1

### Patch Changes

- 35b0381: Include colocated component templates in the published addon using Embroider's template-colocation transform. Correct app reexports so JsonRenderer and its recursive JsonNode component resolve in consuming applications.

## 0.2.0

### Minor Changes

- 663638f: Initial Ember adapter release with a registry-driven Glimmer renderer, shared json-render state and action support, and a tracked SpecStream client.
