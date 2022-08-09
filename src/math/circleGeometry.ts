export function calculateXPositionOnCircleByPercent(decimalPointPercent: number) {
  // console.log("getXCoordinateForPercent: ", Math.cos(2 * Math.PI * percent));
  return Math.cos(2 * Math.PI * decimalPointPercent);
}

export function calculateYPositionOnCircleByPercent(decimalPointPercent: number) {
  // console.log("getYCoordinateForPercent: ", Math.sin(2 * Math.PI * percent));
  return Math.sin(2 * Math.PI * decimalPointPercent);
}

export function calculateLargeArcFlagByPercent(decimalPointPercent: number) {
  // console.log("calculateLargeArcFlag: ", percent > .5 ? 1 : 0);
  return decimalPointPercent > 0.5 ? 1 : 0;
}
