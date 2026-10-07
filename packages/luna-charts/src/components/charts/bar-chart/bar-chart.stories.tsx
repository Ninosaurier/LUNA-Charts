import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { h } from '@stencil/core';
import { BarChart } from './bar-chart';

const meta: Meta<BarChart> = {
  title: 'BarChart',
  component: BarChart,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<BarChart>;

export const Primary: Story = {
  args: {},
  render: () => <bar-chart title="test" />,
};

export const Secondary: Story = {
  args: {},
};
