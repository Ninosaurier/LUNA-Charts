import { newE2EPage } from '@stencil/core/testing';
import { describe, expect, it } from 'vitest';

describe('bar-chart', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<bar-chart></bar-chart>');

    const element = await page.find('bar-chart');
    expect(element).toHaveClass('hydrated');
  });
});
