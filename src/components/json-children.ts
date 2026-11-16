import Component from '@glimmer/component';

interface Args { slot?: string; }

/** Named template marker for Ember catalog components. The renderer passes
 * child nodes in the default block; render a named slot by yielding where
 * your component chooses to place it. */
export default class JsonChildren extends Component<{ Args: Args; Blocks: { default: [] } }> {}
