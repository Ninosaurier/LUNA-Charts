import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'bar-chart',
  styleUrl: 'bar-chart.css',
  shadow: true,
})
export class BarChart {

  @Prop() title: string = "Hello World";

  render() {
    return (
      <Host>
        <slot>{this.title}</slot>
      </Host>
    );
  }
}
