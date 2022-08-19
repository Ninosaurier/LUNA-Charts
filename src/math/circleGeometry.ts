export function calculateXPositionOnCircleByPercent(decimalPointPercent: number) {
  return Math.cos(2 * Math.PI * decimalPointPercent);
}

export function calculateYPositionOnCircleByPercent(decimalPointPercent: number) {
  return Math.sin(2 * Math.PI * decimalPointPercent);
}

export function calculateLargeArcFlagByPercent(decimalPointPercent: number) {
  return decimalPointPercent > 0.5 ? 1 : 0;
}
