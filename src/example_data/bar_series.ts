interface BarSeries {
    name: string,
    data: any[]
}

interface BarChart{
    series: BarSeries[],
    category: string[]
}

const tokyoSeries: BarSeries = {
  name: 'Tokyo',
  data: [{
    value: 50,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 70,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 100,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 129,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 110,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 176,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 80,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 90,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 150,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 180,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 134,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 111,
    ariaLabel: 'Rainfall for January is ',
  }],
};

const berlinSeries: BarSeries = {
  name: 'Berlin',
  data: [{
    value: 50,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 30,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 70,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 10,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 20,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 20,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 3,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 7,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 4,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 18,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 37,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 40,
    ariaLabel: 'Rainfall for January is ',
  }],
};

const newYorkSeries: BarSeries = {
  name: 'New York',
  data: [{
    value: 20,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 30,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 10,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 11,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 33,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 20,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 11,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 50,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 30,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 17,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 19,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 40,
    ariaLabel: 'Rainfall for January is ',
  }],
};

const londonSeries: BarSeries = {
  name: 'London',
  data: [{
    value: 50,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 70,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 100,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 129,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 110,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 176,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 80,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 90,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 150,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 180,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 134,
    ariaLabel: 'Rainfall for January is ',
  },
  {
    value: 111,
    ariaLabel: 'Rainfall for January is ',
  }],
};

export const barChartTestData: BarChart = {
  series: [londonSeries, newYorkSeries],
  category: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'december'],
};
