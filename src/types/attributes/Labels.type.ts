import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const LabelSchema = Type.Object({
  x: Type.String(),
  y: Type.String(),
  secondY: Type.String(),
});

export type Label = Static<typeof LabelSchema>;

export const defaultLabel: Label = {
  x: 'X-Axis',
  y: 'Y-Axis',
  secondY: '',
};
