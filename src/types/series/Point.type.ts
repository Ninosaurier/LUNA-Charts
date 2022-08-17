import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const PointSchema = Type.Object({
  x: Type.Integer(),
  y: Type.Integer(),
  ariaLabel: Type.String({
    $comment:
      'this will set the aria label attribute for accessibility',
  }),
});

export type Point = Static<typeof PointSchema>;
