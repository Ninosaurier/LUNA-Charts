import { barChartTestData } from '../example_data/bar_series.ts';
import BarChart from '../components/BarChart.svelte';

export default {
  title: 'BarChart',
  component: BarChart,
  argTypes: {
    title: 'Test title',
    desc: 'This description is accessible and  your screenreader wil detect it.',
    source: 'https://www.capgemini.com/',
  },
};

const Template = (args) => ({
  Component: BarChart,
  props: args,
});

export const FirstTest = Template.bind({});
FirstTest.args = {
  series: barChartTestData,
  title: 'Test title',
  desc: 'This description is accessible and  your screenreader will detect it.',
};
