import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

export const Colors = Type.Array(Type.String());

const Grid = Type.Object({
  gridColor: Type.String(),
  gridSize: Type.String(),
});

const ChartStyles = Type.Object({
  backgroundColor: Type.String(),
});

const LineTheme = Type.Object({
  name: Type.String(),
  colors: Colors,
  circles: Type.Object({
    radius: Type.String(),
    focusColor: Type.String(),
    focusRadius: Type.String(),
  }),
  grid: Grid,
  chartStyles: ChartStyles,
});

// eslint-disable-next-line no-redeclare
export type LineTheme = Static<typeof LineTheme>;

// PieTheme
export const PieTheme = Type.Object({
  name: Type.String(),
  colors: Colors,
  focusBorder: Type.String(),
});

// eslint-disable-next-line no-redeclare
export type PieTheme = Static<typeof PieTheme>;

const BarTheme = Type.Object({
  name: Type.String(),
  colors: Colors,
  focusColor: Type.String(),
  grid: Grid,
  chartStyles: ChartStyles,
});

// eslint-disable-next-line no-redeclare
export type BarTheme = Static<typeof BarTheme>;
