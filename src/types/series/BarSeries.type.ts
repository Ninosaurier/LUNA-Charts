import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const BarValueSchema = Type.Object({
  value: Type.Number(),
  ariaLabel: Type.String(),
});

export type BarValue = Static<typeof BarValueSchema>;

const BarSchema = Type.Object({
  name: Type.String(),
  barValues: Type.Array(BarValueSchema),
});

export type Bar = Static<typeof BarSchema>;

const BarSeriesSchema = Type.Object({
  series: Type.Array(BarSchema),
  category: Type.Array(Type.String()),
});

export type BarSeries = Static<typeof BarSeriesSchema>;
