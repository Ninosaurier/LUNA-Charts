import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const PieSliceSchema = Type.Object({
  name: Type.String(),
  percent: Type.Number(),
  color: Type.String(),
});

export const PieSeriesSchema = Type.Object({
  slices: Type.Array(PieSliceSchema),
});

export type PieSlice = Static<typeof PieSliceSchema>;
export type PieSeries = Static<typeof PieSeriesSchema>;
