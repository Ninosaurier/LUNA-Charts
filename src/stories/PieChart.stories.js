import { testPieSeries } from '../example_data/pie_series.ts';
import PieChart from '../components/PieChart.svelte';

export default {
  title: 'PieChart',
  component: PieChart,
  argTypes: {
    title: 'Test title',
    desc: 'This description is accessible and  your screenreader will detect it.',
    source: 'https://www.capgemini.com/',
  },
};

const Template = (args) => ({
  Component: PieChart,
  props: args,
});

export const FirstTest = Template.bind({});
FirstTest.args = {
  series: testPieSeries,
  title: 'Pie Chart',
  desc: 'This description is accessible and your screenreader will detect it.',
};

export const EmptyTest = Template.bind({});
EmptyTest.args = {
  title: 'Empty pie Chart',
  desc: 'This description is accessible and your screenreader will detect it.',
};
