import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import type { Point } from './Point.type';

const LineSeries = Type.Object({
  name: Type.String(),
  points: Type.Array(Point),
  color: Type.String(),
});

export type LineSeries = Static<typeof LineSeries>;
