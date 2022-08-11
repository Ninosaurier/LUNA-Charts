import type { PieSeries, PieSlice } from '../types/series/PieSeries.Type';

const pieSlices: PieSlice[] = [
  {
    name: 'Firefox',
    percent: 0.35,
  },
  {
    name: 'Chrome',
    percent: 0.35,
  },
  {
    name: 'Safari',
    percent: 0.2,
  },
  {
    name: 'IE',
    percent: 0.1,
  },
];

// eslint-disable-next-line import/prefer-default-export
export const testPieSeries: PieSeries = {
  slices: pieSlices,
};
