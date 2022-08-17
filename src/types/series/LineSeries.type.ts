import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
// eslint-disable-next-line import/extensions
import { PointSchema } from './Point.type';

const LineSeriesSchema = Type.Object({
  name: Type.String(),
  points: Type.Array(PointSchema),
  color: Type.String(),
});

export type LineSeries = Static<typeof LineSeriesSchema>;
