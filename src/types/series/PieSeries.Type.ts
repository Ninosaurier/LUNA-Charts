import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const PieSlice = Type.Object({
  name: Type.String(),
  percent: Type.Number(),
});

export const PieSeries = Type.Object({
  slices: Type.Array(PieSlice),
});

export type PieSlice = Static<typeof PieSlice>;
export type PieSeries = Static<typeof PieSeries>;
