import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const PieSlicesSchema = Type.Object({
  name: Type.String(),
  percent: Type.Number(),
  color: Type.String(),
});

export const PieSeriesSchema = Type.Object({
  slices: Type.Array(PieSlicesSchema),
});

export type PieSlices = Static<typeof PieSlicesSchema>;
export type PieSeries = Static<typeof PieSeriesSchema>;
