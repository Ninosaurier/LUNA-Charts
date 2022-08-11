import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const BarValue = Type.Object({
  value: Type.Number(),
  ariaLabel: Type.String(),
});

export const Bar = Type.Object({
  name: Type.String(),
  barValues: Type.Array(BarValue),
});

const BarSeries = Type.Object({
  series: Type.Array(Bar),
  category: Type.Array(Type.String()),
});

export type BarValue = Static<typeof BarValue>;
export type Bar = Static<typeof Bar>;
export type BarSeries = Static<typeof BarSeries>;
