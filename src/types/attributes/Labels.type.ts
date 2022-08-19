import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const LabelsSchema = Type.Object({
  x: Type.String(),
  y: Type.String(),
  secondY: Type.String(),
});

export type Labels = Static<typeof LabelsSchema>;

export const defaultLabel: Labels = {
  x: 'X-Axis',
  y: 'Y-Axis',
  secondY: '',
};
