import axe from 'axe-core';
import type { A11yChecker, A11yCheckResult } from './types';

export const axeCoreChecker: A11yChecker = {
  name: 'axe-core',

  async run(rootElement: Element): Promise<A11yCheckResult> {
    const results = await axe.run(rootElement);

    return {
      checkerName: 'axe-core',
      violations: results.violations.map(violations => ({
        id: violations.id,
        impact: violations.impact ?? null,
        description: violations.help,
        helpUrl: violations.helpUrl,
        nodes: violations.nodes.map(node => node.target.join(' ')),
      })),
    };
  },
};
