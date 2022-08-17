import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const CONTRAST_COLORS: string[] = [
  '#003b49',
  '#41b6e6',
  '#d3273e',
  '#ffc845',
  '#d6d2c4',
  '#00bfb2',
];

export const Colors = Type.Array(Type.String());

const Grid = Type.Object({
  gridColor: Type.String(),
  gridSize: Type.String(),
});

const WrapperStyle = Type.Object({
  backgroundColor: Type.String(),
});

const LineThemeSchema = Type.Object({
  name: Type.String(),
  colors: Colors,
  circles: Type.Object({
    radius: Type.String(),
    focusColor: Type.String(),
    focusRadius: Type.String(),
  }),
  grid: Grid,
  wrapperStyles: WrapperStyle,
});

export type LineTheme = Static<typeof LineThemeSchema>;

// PieTheme
export const PieThemeSchema = Type.Object({
  name: Type.String(),
  colors: Colors,
  focusBorder: Type.String(),
  wrapperStyles: WrapperStyle,
});

export type PieTheme = Static<typeof PieThemeSchema>;

const BarThemeSchema = Type.Object({
  name: Type.String(),
  wrapperStyles: WrapperStyle,
  colors: Colors,
  focusColor: Type.String(),
  grid: Grid,
  hatches: Type.Array(Type.String()),
});

export type BarTheme = Static<typeof BarThemeSchema>;
