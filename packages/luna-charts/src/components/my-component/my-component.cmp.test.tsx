import { render, h, describe, it, expect } from '@stencil/vitest';
import { runA11yChecks } from '../../testing/a11y';

describe('my-component', () => {
  it('renders', async () => {
    const { root } = await render(<my-component></my-component>);
    await expect(root).toEqualHtml(`
      <my-component class="hydrated">
        <mock:shadow-root>
          <div>
            Hello, World! I'm
          </div>
        </mock:shadow-root>
      </my-component>
    `);
  });

  it('has no accessibility violations', async () => {
    const { root } = await render(<my-component></my-component>);

    const results = await runA11yChecks(root);
    expect(results).toHaveNoA11yViolations();
  });

  it('renders with values', async () => {
    const { root } = await render(<my-component first="Stencil" middle="'Don't call me a framework'" last="JS"></my-component>);
    await expect(root).toEqualHtml(`
      <my-component class="hydrated">
        <mock:shadow-root>
          <div>
            Hello, World! I'm Stencil 'Don't call me a framework' JS
          </div>
        </mock:shadow-root>
      </my-component>
    `);
  });
});
