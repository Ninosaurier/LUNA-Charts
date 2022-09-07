# LUNA Charts

## Table of contents
- [LUNA Charts](#luna-charts)
  - [Table of contents](#table-of-contents)
  - [Description](#description)
  - [How to install](#how-to-install)
  - [How to use](#how-to-use)
  - [How to edit a chart](#how-to-edit-a-chart)
  - [Use themes](#use-themes)
  - [Doc](#doc)
  - [Examples](#examples)
  - [Known problems](#known-problems)

## Description
Luna was my family dog. LUNA Charts is an acronym and stands for **Library for Userfriendly 'N Accessible** Charts. It is a component library for creating accessible charts. The package has three built-in charts:
- LineChart
- BarChart
- PieChart

Important: The package is still in process
## How to install
```
npm i luna_charts
```
## How to use
For example pie chart:
```
import PieChart from 'luna_charts/src/components/PieChart.svelte';
import type { PieSeries, PieSlice } from 'luna_charts/types/series/PieSeries.Type';
import type {ChartInfo} from 'luna_charts/types/attributes/ChartInfo.types';

export let chartInfo: ChartInfo = {
  title: "A typical Pie chart",
  desc: "This is a accessible description. Your screenreader will read it for you.",
  source: "https://www.w3.org"
} as ChartInfo

const pieSlices: PieSlice[] = [
  {
    name: 'Firefox',
    percent: 0.35,
    color: 'ff0000',
  },
  {
    name: 'Chrome',
    percent: 0.35,
    color: 'ffff00',
  },
  {
    name: 'Safari',
    percent: 0.2,
    color: 'ffffff',
  },
  {
    name: 'IE',
    percent: 0.1,
    color: '000000',
  },
];

export const testPieSeries: PieSeries = {
  slices: pieSlices,
};

<PieChart chartInfo="{chartInfo}" series="{testPieSeries}" \>
```

## How to edit a chart

LUNA Charts offers you some ready-made data types for editing charts.
```
// defines the description, title and source
import type {ChartInfo} from '../types/attributes/ChartInfo.types';

export let chartInfo: ChartInfo = {
  title: "Revenue of three big companies",
  desc: "The bar chart shows the revenue for Apple, Google and Microsoft divided in the seasons.",
  source: "https://www.w3.org"
} as ChartInfo
```

If you want to change the labels for the axis, then you can use the data type **Labels**. Note: The pie chart hat **no** labels attribut. Example:
```
// defines the different labels for the axis
import {type Labels} from '../types/attributes/Labels.type';

export let labels: Labels = {x: "Seasons", y: "Euro in million", secondY: ''} as Labels;
```
You are not good at math? Don´t worry! With **Series**, LUNA will render for you every number. You need only to choose the right data type:
If you want to change the labels for the axis, then you can use the data type **Labels**. Note: The pie chart hat **no** labels attribut. Example:
```
// Prepare the series for the BarChart
import type { BarSeries, BarValues, Bar } from '../types/series/BarSeries.type';

const appleBarValues: BarValues[] = [
  {
    value: 10,
    ariaLabel: 'The revenue in 2020 for Apple is: ',
  },
  {
    value: 20,
    ariaLabel: 'The revenue in 2021 for Apple is: ',
  },
];

const appleRevenue: Bar = {
  name: 'Apple',
  barValues: appleBarValues,
};

export const testBarSeries: BarSeries = {
  series: [appleRevenue],
  category: ['2020', '2021'],
};
```
Set width and height with dimension:
```
import type {Dimension} from '../types/attributes/Dimension.type';

export let dimension: Dimension = {width: "800", height: "300"} as Dimension;
```

Do you need more contrast? Then do this:
```
<LineChart hatchPatterns="true" />
```
## Use themes
Ok, that sound good! But how i can change the color or other stuff of the chart? Also here LUNA provides suitable data types:
```
import { HATCH_PATTERNS } from '../types/theme/Hatch.type.ts';
import { CONTRAST_COLORS } from '../types/theme/Theme.type.ts';
import type { BarTheme } from '../types/theme/Theme.type';

export const defaultBarTheme: BarTheme = {
  name: 'barDefaultTheme',
  colors: CONTRAST_COLORS,
  focusColor: '#66ff99',
  wrapperStyles: {
    backgroundColor: '#F7F7F7',
  },
  grid: {
    gridColor: '',
    gridSize: '',
  },
  hatches: [HATCH_PATTERNS.CIRCLES, HATCH_PATTERNS.DIAGONAL, HATCH_PATTERNS.H_LINE],
};
```
Please note, every chart has it own theme.

## Doc
We document our charts in Storybook. For more detailed information run:
```
npm run storybook
```

## Examples
You want to see, how the charts look likes? [Click here](https://www.chromatic.com/library?appId=62ffa7843853f7f93bf0ebcc)

## Known problems
If you install the package in a svelte project, add the following line in your tsconfig.json:
```
{
  "extends": "@tsconfig/svelte/tsconfig.json",

  "include": ["src/**/*","node_modules/luna_charts/src/**/*"],
  "exclude": ["__sapper__/*", "public/*"]
}
```
Svelte need to compile the charts in the luna_package package too.