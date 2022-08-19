import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const DimensionSchema = Type.Object({
  width: Type.String(),
  height: Type.String(),
});

export type Dimension = Static<typeof DimensionSchema>;
