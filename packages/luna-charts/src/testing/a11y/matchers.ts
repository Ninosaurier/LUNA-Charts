import { expect } from 'vitest';
import type { A11yCheckResult } from './checkers/types';

expect.extend({
  toHaveNoA11yViolations(results: A11yCheckResult[]) {
    const failing = results.filter((results) => results.violations.length > 0);

    if (failing.length === 0) {
      return {
        pass: true,
        message: () => 'expected accessibility violations, but none were found',
      };
    }

    const message = failing
      .map(
        (results) =>
          `[${results.checkerName}] ${results.violations.length} violation(s):\n` +
          results.violations
            .map((validation) => `  - ${validation.id} (${validation.impact}): ${validation.description}\n    affected: ${validation.nodes.join(', ')}`)
            .join('\n')
      )
      .join('\n\n');

    return {
      pass: false,
      message: () => `Accessibility violations found:\n\n${message}`,
    };
  },
});

declare module 'vitest' {
  interface Assertion {
    toHaveNoA11yViolations(): void;
  }
}