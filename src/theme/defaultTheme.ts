//
import { HATCH_PATTERNS } from '../types/theme/Hatch.type.ts';
import { CONTRAST_COLORS } from '../types/theme/Theme.type.ts';
import type { LineTheme, PieTheme, BarTheme } from '../types/theme/Theme.type';

export const defaultLineTheme: LineTheme = {
  name: 'defaultLineTheme',
  colors: CONTRAST_COLORS,
  circles: {
    radius: '3px',
    focusColor: '#000000',
    focusRadius: '50px',
  },
  wrapperStyles: {
    backgroundColor: '#F7F7F7',
  },
  grid: {
    gridColor: '',
    gridSize: '',
  },
};

export const defaultPieTheme: PieTheme = {
  name: 'pieDefaultTheme',
  colors: CONTRAST_COLORS,
  focusBorder: '#e56db1',
  wrapperStyles: { backgroundColor: '#F7F7F7' },
};

export const defaultBarTheme: BarTheme = {
  name: 'barDefaultTheme',
  colors: CONTRAST_COLORS,
  focusColor: '#000000',
  wrapperStyles: {
    backgroundColor: '#F7F7F7',
  },
  grid: {
    gridColor: '',
    gridSize: '',
  },
  hatches: [HATCH_PATTERNS.CIRCLES, HATCH_PATTERNS.DIAGONAL, HATCH_PATTERNS.H_LINE],
};
