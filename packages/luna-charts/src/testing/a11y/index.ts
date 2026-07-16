import type { A11yChecker, A11yCheckResult } from './checkers/types';
import { axeCoreChecker } from './checkers/axe-core.checker';

const a11yCheckerRegistry: A11yChecker[] = [
  axeCoreChecker,
];

export async function runA11yChecks(rootElement: Element): Promise<A11yCheckResult[]> {
  return Promise.all(a11yCheckerRegistry.map((a11yChecker) => a11yChecker.run(rootElement)));
}

export type { A11yChecker, A11yCheckResult, A11yViolation } from './checkers/types';