---
"ember-json-render": patch
---

Generate and publish TypeScript declarations with type-aware root and subpath exports. Correct catalog component signatures to include the yielded default block and export `JsonRenderComponentSignature` for use by catalog components, so TypeScript and Glint consumers no longer need local addon declaration shims.
