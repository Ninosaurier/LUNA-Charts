# LUNA Charts

## Table of contents
- [Description](#description)
- [How to install](#how-to-install)
- [How to use](#how-to-use)
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