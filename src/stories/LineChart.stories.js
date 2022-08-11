import { testLineSeries } from '../example_data/line_series.ts';
import LineChart from '../components/LineChart.svelte';

export default {
  title: 'LineChart',
  component: LineChart,
  argTypes: {
    title: 'Test title',
    desc: 'This description is accessible and  your screenreader wil detect it.',
    source: 'https://www.capgemini.com/',
  },
};

const Template = (args) => ({
  Component: LineChart,
  props: args,
});

export const FirstTest = Template.bind({});
FirstTest.args = {
  series: testLineSeries,
  title: 'First Line chart',
  desc: 'This description is accessible and  your screenreader will detect it.',
};
