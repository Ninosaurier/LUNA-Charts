import type { PieSeries, PieSlices } from '../types/series/PieSeries.Type';
import { CONTRAST_COLORS } from '../types/theme/Theme.type';

const pieSlices: PieSlices[] = [
  {
    name: 'Firefox',
    percent: 0.33,
    color: CONTRAST_COLORS[0],
  },
  {
    name: 'Chrome',
    percent: 0.35,
    color: CONTRAST_COLORS[1],
  },
  {
    name: 'Safari',
    percent: 0.2,
    color: CONTRAST_COLORS[2],
  },
  {
    name: 'IE',
    percent: 0.1,
    color: CONTRAST_COLORS[3],
  },
  {
    name: 'Opera',
    percent: 0.01,
    color: CONTRAST_COLORS[4],
  },
  {
    name: 'Vivaldi',
    percent: 0.01,
    color: CONTRAST_COLORS[5],
  },
];

// eslint-disable-next-line import/prefer-default-export
export const testPieSeries: PieSeries = {
  slices: pieSlices,
};
