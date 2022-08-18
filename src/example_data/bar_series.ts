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

const berlinBarValues: BarValue[] = [
  {
    value: 100,
    ariaLabel: 'The Rainfall for spring is: ',
  },
  {
    value: 33,
    ariaLabel: 'The Rainfall for summer is: ',
  },
  {
    value: 93,
    ariaLabel: 'The Rainfall for autumn is: ',
  },
  {
    value: 65,
    ariaLabel: 'The Rainfall for winter is: ',
  },
];

const milanRainFall: Bar = {
  name: 'Milan',
  barValues: milanBarValues,
};

const londonRainFall: Bar = {
  name: 'London',
  barValues: londonBarValues,
};

const berlinRainFall: Bar = {
  name: 'Berlin',
  barValues: berlinBarValues,
};

// eslint-disable-next-line import/prefer-default-export
export const testBarSeries: BarSeries = {
  series: [milanRainFall, londonRainFall],
  category: ['Spring', 'Summer', 'Autumn', 'Winter'],
};

export const testTwoBarSeries: BarSeries = {
  series: [milanRainFall, londonRainFall, berlinRainFall],
  category: ['Spring', 'Summer', 'Autumn', 'Winter'],
};

const appleBarValues: BarValue[] = [
  {
    value: 100,
    ariaLabel: 'The sales for spring is: ',
  },
  {
    value: 33,
    ariaLabel: 'The sales for summer is: ',
  },
  {
    value: 93,
    ariaLabel: 'The sales for autumn is: ',
  },
  {
    value: 65,
    ariaLabel: 'The sales for winter is: ',
  },
];

const appleSales: Bar = {
  name: 'Apple',
  barValues: appleBarValues,
};

const microsoftBarValues: BarValue[] = [
  {
    value: 25,
    ariaLabel: 'The sales for spring is: ',
  },
  {
    value: 40,
    ariaLabel: 'The sales for summer is: ',
  },
  {
    value: 77,
    ariaLabel: 'The sales for autumn is: ',
  },
  {
    value: 111,
    ariaLabel: 'The sales for winter is: ',
  },
];

const microsoftSales: Bar = {
  name: 'Microsoft',
  barValues: microsoftBarValues,
};

const googleBarValues: BarValue[] = [
  {
    value: 45,
    ariaLabel: 'The sales for spring is: ',
  },
  {
    value: 55,
    ariaLabel: 'The sales for summer is: ',
  },
  {
    value: 85,
    ariaLabel: 'The sales for autumn is: ',
  },
  {
    value: 27,
    ariaLabel: 'The sales for winter is: ',
  },
];

const googletSales: Bar = {
  name: 'Google',
  barValues: googleBarValues,
};

export const salesSeries: BarSeries = {
  series: [appleSales, microsoftSales, googletSales],
  category: ['Spring', 'Summer', 'Autumn', 'Winter'],
};
