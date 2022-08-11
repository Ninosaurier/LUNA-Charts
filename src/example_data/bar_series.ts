import type { BarSeries, BarValue, Bar } from '../types/series/BarSeries.type';

const milanBarValues: BarValue[] = [
  {
    value: 10,
    ariaLabel: 'The Rainfall for spring is: ',
  },
  {
    value: 20,
    ariaLabel: 'The Rainfall for summer is: ',
  },
  {
    value: 40,
    ariaLabel: 'The Rainfall for autumn is: ',
  },
  {
    value: 50,
    ariaLabel: 'The Rainfall for winter is: ',
  },
];

const londonBarValues: BarValue[] = [
  {
    value: 33,
    ariaLabel: 'The Rainfall for spring is: ',
  },
  {
    value: 100,
    ariaLabel: 'The Rainfall for summer is: ',
  },
  {
    value: 60,
    ariaLabel: 'The Rainfall for autumn is: ',
  },
  {
    value: 74,
    ariaLabel: 'The Rainfall for winter is: ',
  },
];

const milanRainFall: Bar = {
  name: 'milan',
  barValues: milanBarValues,
};

const LondonRainFall: Bar = {
  name: 'London',
  barValues: londonBarValues,
};

// eslint-disable-next-line import/prefer-default-export
export const testBarSeries: BarSeries = {
  series: [milanRainFall, LondonRainFall],
  category: ['Spring', 'Summer', 'Autumn', 'Winter'],
};
