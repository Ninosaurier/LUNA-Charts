import { newSpecPage } from '@stencil/core/testing';
import { BarChart } from '../bar-chart';
import { describe, expect, it } from 'vitest';

describe('bar-chart', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BarChart],
      html: `<bar-chart></bar-chart>`,
    });
    expect(page.root).toEqualHtml(`
      <bar-chart>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </bar-chart>
    `);
  });
});
