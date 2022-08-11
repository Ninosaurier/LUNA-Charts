import type { LineTheme, PieTheme, BarTheme } from '../types/theme/Theme.type';

// eslint-disable-next-line import/prefer-default-export
export const defaultTheme = [
  {
    name: 'default',
    color: {
      primary: '#1580bc',
      secondary: '#bd8016',
      tertiary: '#0ccd6c',
      quaternary: '#cd0c0c',
    },
    circles: {
      radius: '3px',
      'focus-color': '#FF0000',
      'focus-radius': '50px',
    },
    chart: {
      'background-color': '#659DBD',
    },
    grid: {
      color: '#ffffff',
    },
  },
];

export const testTheme: LineTheme = {
  name: 'test-theme',
  colors: ['#1580bc', '#bd8016', '#0ccd6c', '#cd0c0c'],
  circles: {
    radius: '3px',
    focusColor: '#FF0000',
    focusRadius: '50px',
  },
  chartStyles: {
    backgroundColor: '#F7F7F7',
  },
  grid: {
    gridColor: '',
    gridSize: '',
  },
};

export const testPieTheme: PieTheme = {
  name: 'test-theme',
  colors: ['#1580bc', '#bd8016', '#0ccd6c', '#cd0c0c'],
  focusBorder: 'grey',
};

export const testBarTheme: BarTheme = {
  name: 'test-theme',
  colors: ['#1580bc', '#bd8016', '#0ccd6c', '#cd0c0c'],
  focusColor: '#FF0000',
  chartStyles: {
    backgroundColor: '#F7F7F7',
  },
  grid: {
    gridColor: '',
    gridSize: '',
  },
};
