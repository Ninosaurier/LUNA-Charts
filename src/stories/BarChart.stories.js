import { testBarSeries, testTwoBarSeries } from '../example_data/bar_series.ts';
import BarChart from '../components/BarChart.svelte';

export default {
  title: 'BarChart',
  component: BarChart,
  argTypes: {
    title: 'Test title',
    desc: 'This description is accessible and your screenreader will detect it.',
    source: 'https://www.capgemini.com/',
  },
};

const Template = (args) => ({
  Component: BarChart,
  props: args,
});

export const FirstTest = Template.bind({});
FirstTest.args = {
  series: testBarSeries,
  hatchPatterns: true,
  title: 'Test title',
  desc: 'This description is accessible and your screenreader will detect it.',
};

export const WithSecondYLabel = Template.bind({});
WithSecondYLabel.args = {
  series: testTwoBarSeries,
  hatchPatterns: true,
  title: 'Test title',
  desc: 'This description is accessible and your screenreader will detect it.',
  secondYLabel: 'Second Y Label',
  source: 'http://www.capgemini.com',
};

export const WithoutHatches = Template.bind({});
WithoutHatches.args = {
  series: testBarSeries,
  title: 'Bar Chart',
  desc: 'Hatches are not shown. Value of "hatchPatterns" are false.',
};

export const EmptyTest = Template.bind({});
EmptyTest.args = {
  title: 'Test title with empty Series',
  desc: 'This description is accessible and  your screenreader will detect it.',
};
