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

const problemSlices: PieSlice[] = [
  {
    name: 'Inter Milan',
    percent: 0.50,
  },
  {
    name: 'Bayern',
    percent: 0.02,
  },
  {
    name: 'Real Madrid',
    percent: 0.02,
  },
  {
    name: 'Liverpool',
    percent: 0.01,
  },
  {
    name: 'Rot Weiss Essen',
    percent: 0.45,
  },
];

// eslint-disable-next-line import/prefer-default-export
export const testPieSeries: PieSeries = {
  slices: pieSlices,
};

export const problemPieSeries: PieSeries = {
  slices: problemSlices,
};
