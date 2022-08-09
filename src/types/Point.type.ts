import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const Point = Type.Object({
  x: Type.Integer(),
  y: Type.Integer(),
  ariaLabel: Type.String({
    $comment:
      'this will set the aria label attribute for accessibility',
  }),
});

export type Point = Static<typeof Point>;
