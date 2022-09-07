/* eslint-disable import/prefer-default-export */
import type { LineSeries, Points } from '../types/series/LineSeries.type';

const testLineOne: Points[] = [
  {
    x: 0,
    y: 0,
    ariaLabel: 'Point 1',
  },
  {
    x: 20,
    y: 30,
    ariaLabel: 'Point 2',
  },
  {
    x: 40,
    y: 10,
    ariaLabel: 'Point 3',
  },
  {
    x: 70,
    y: 50,
    ariaLabel: 'Point 4',
  },
  {
    x: 80,
    y: 70,
    ariaLabel: 'Point 3',
  },
  {
    x: 100,
    y: 20,
    ariaLabel: 'Point 3',
  },
  {
    x: 130,
    y: 35,
    ariaLabel: 'Point 3',
  },
  {
    x: 180,
    y: 60,
    ariaLabel: 'Point 3',
  },
];

const testLineTwo: Points[] = [
  {
    x: 10,
    y: 10,
    ariaLabel: 'Point 1',
  },
  {
    x: 30,
    y: 50,
    ariaLabel: 'Point 2',
  },
  {
    x: 80,
    y: 15,
    ariaLabel: 'Point 3',
  },
  {
    x: 100,
    y: 50,
    ariaLabel: 'Point 4',
  },
];

const testLineThree: Points[] = [
  {
    x: 100,
    y: 10,
    ariaLabel: 'Point 1',
  },
  {
    x: 120,
    y: 50,
    ariaLabel: 'Point 2',
  },
];

export const testLineSeries: LineSeries[] = [
  {
    name: 'Line 1',
    points: testLineOne,
    color: '',
  },
  {
    name: 'test line 2',
    points: testLineTwo,
    color: '',
  },
  {
    name: 'Line 3',
    points: testLineThree,
    color: '',
  },
];
