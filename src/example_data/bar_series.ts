import type { BarSeries, BarValues, Bar } from '../types/series/BarSeries.type';

const appleBarValues: BarValues[] = [
  {
    value: 10,
    ariaLabel: 'The revenue in spring for Apple is: ',
  },
  {
    value: 20,
    ariaLabel: 'The revenue in summer for Apple is: ',
  },
  {
    value: 40,
    ariaLabel: 'The revenue in autumn for Apple is: ',
  },
  {
    value: 50,
    ariaLabel: 'The revenue in winter for Apple is: ',
  },
];

const microsoftBarValues: BarValues[] = [
  {
    value: 33,
    ariaLabel: 'The revenue in spring for microsoft is: ',
  },
  {
    value: 100,
    ariaLabel: 'The revenue in summer for microsoft is: ',
  },
  {
    value: 60,
    ariaLabel: 'The revenue in autumn for microsoft is: ',
  },
  {
    value: 74,
    ariaLabel: 'The revenue in winter for microsoft is: ',
  },
];

const googleBarValues: BarValues[] = [
  {
    value: 100,
    ariaLabel: 'The revenue in spring for Google is: ',
  },
  {
    value: 33,
    ariaLabel: 'The revenue in summer for Google is: ',
  },
  {
    value: 93,
    ariaLabel: 'The revenue in autumn for Google is: ',
  },
  {
    value: 65,
    ariaLabel: 'The revenue in winter for Google is: ',
  },
];

const appleRevenue: Bar = {
  name: 'Apple',
  barValues: appleBarValues,
};

const microsoftRevenue: Bar = {
  name: 'Microsoft',
  barValues: microsoftBarValues,
};

const googleRevenue: Bar = {
  name: 'Google',
  barValues: googleBarValues,
};

// eslint-disable-next-line import/prefer-default-export
export const testBarSeries: BarSeries = {
  series: [appleRevenue, microsoftRevenue],
  category: ['Spring', 'Summer', 'Autumn', 'Winter'],
};

export const testTwoBarSeries: BarSeries = {
  series: [appleRevenue, microsoftRevenue, googleRevenue],
  category: ['Spring', 'Summer', 'Autumn', 'Winter'],
};
