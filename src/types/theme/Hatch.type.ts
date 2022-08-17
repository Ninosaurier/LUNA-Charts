import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const HatchSchema = Type.Object({
  name: Type.String(),
  pattern: Type.String(),
});

export type HatchPattern = Static<typeof HatchSchema>;

// Added "no-shadow". It is not a bug or bad practice. There is a bug in eslint
// See: https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
/* eslint-disable no-shadow,  no-unused-vars */
export const enum HATCH_PATTERNS {
  CIRCLES = 'circles',
  SQUARE = 'square',
  H_LINE = 'hLine',
  DIAGONAL = 'diagonal',
}
/* eslint-enable no-shadow,  no-unused-vars */
