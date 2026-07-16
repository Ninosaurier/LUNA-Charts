export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  helpUrl?: string;
  nodes: string[];
}

export interface A11yCheckResult {
  checkerName: string;
  violations: A11yViolation[];
}

export interface A11yChecker {
  name: string;
  run(root: Element): Promise<A11yCheckResult>;
}