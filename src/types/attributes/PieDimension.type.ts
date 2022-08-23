import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const PiDimensionSchema = Type.Object({
  width: Type.String(),
  height: Type.String(),
  resolution: Type.Number(),
  zoom: Type.Number(),
});

export type PiDimension = Static<typeof PiDimensionSchema>;
