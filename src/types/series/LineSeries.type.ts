import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
// eslint-disable-next-line import/extensions

const PointSchema = Type.Object({
  x: Type.Integer(),
  y: Type.Integer(),
  ariaLabel: Type.String({
    $comment:
      'this will set the aria label attribute for accessibility',
  }),
});

export type Point = Static<typeof PointSchema>;

const LineSeriesSchema = Type.Object({
  name: Type.String(),
  points: Type.Array(PointSchema),
  color: Type.String(),
});

export type LineSeries = Static<typeof LineSeriesSchema>;
