import { pieSeriesExample } from '../example_data/pie_series.ts';
import PieChart from '../components/PieChart.svelte';

export default {
  title: 'PieChart',
  component: PieChart,
  argTypes: {
    title: 'Test title',
    desc: 'This description is accessible and  your screenreader wil detect it.',
    source: 'https://www.capgemini.com/',
  },
};

const Template = (args) => ({
  Component: PieChart,
  props: args,
});

export const FirstTest = Template.bind({});
FirstTest.args = {
  series: pieSeriesExample,
  title: 'Test title',
  desc: 'This description is accessible and  your screenreader will detect it.',
};
