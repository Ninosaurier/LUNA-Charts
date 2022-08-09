import type { Point } from '../types/Point.type';

export interface Line {
  name: string;
  points: Point[];
  color: string;
}

export interface LineChartType {
  title: string;
  description: string;
  source: string;
  yLabel: string;
  xLabel: string;
  secondYLabel: string;
  series: Line[];
}

export const LineChartTestData: LineChartType = {
  title: 'test',
  description: 'This is a accessible test line chart',
  source: 'https://svelte.dev/',
  series: [],
  yLabel: 'Y points',
  xLabel: 'X points',
  secondYLabel: 'More y points',
};
