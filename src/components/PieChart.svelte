<script lang="ts">
    import { onMount } from 'svelte';
    import {generateId} from '../utils/common';
    import ThemeContext from '../core/ThemeContext.svelte';
    import type {PieSeries, PieSlice} from './../types/series/PieSeries.Type';
    import type {PieTheme} from '../types/theme/Theme.type';
    import {defaultPieTheme} from '../theme/defaultTheme';
    import {createHeaderTagForElement} from '../utils/accessibles';
    import type {ChartInfo} from '../types/attributes/ChartInfo.type';
    import type {PieDimension} from '../types/attributes/PieDimension.type';
    import {
      calculateLargeArcFlagByPercent,
      calculateXPositionOnCircleByPercent,
      calculateYPositionOnCircleByPercent
    } from '../math/circleGeometry';

    export let chartInfo: ChartInfo = {
      title: "Pie chart title",
      desc: "This description is accessible and your screenreader will detect it.",
      source: ""
    } as ChartInfo
    export let theme: PieTheme = defaultPieTheme;
    export let dimension: PieDimension = {width: "800", height: "300", resolution:800, zoom:1.2} as PieDimension;
    export let series: PieSeries = {} as PieSeries;

    let colors: any[];
    let idChart: string;
    let headerChartParentTag: HTMLElement;
    let cumulativePercents:number[] = partialSum(series.slices);
    let displayFront:SVGElement;

    function partialSum(slices:PieSlice[], unshiftZero:boolean = true){

      if(slices === undefined){
        return [] as number[];
      }

      let partialSliceSums:number[] = Array(slices.length).fill(0);

      for(let i = 0; i<slices.length; i++){

        if(i === 0){
          partialSliceSums[i] = slices[i].percent;
        }
        else{

          partialSliceSums[i] = partialSliceSums[i-1] + slices[i].percent;
        }
      }

      if(unshiftZero) {partialSliceSums.unshift(0);}

      return partialSliceSums;
    }

    onMount(async () => {

      colors = Object.values(theme.colors);
      idChart = generateId();
      createHeaderTagForElement(headerChartParentTag, chartInfo.title);
    });

    function moveSliceForward(event: Event): void{

      let slice: SVGElement = (event.target as SVGElement);

      let sliceBorder: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      sliceBorder.setAttribute('d', slice.getAttribute('d')!.toString());
      sliceBorder.classList.add('show_slice_border');

      displayFront.appendChild(sliceBorder);

    }

    function unmaskLegend(event: Event): void{
      let name: string = (event.target as SVGElement).id + "_low_legend";

      if( document.getElementById(name) !== null){
        document.getElementById(name)?.classList.remove("marked_legend");
      }
    }

    function markLowLegend(event: Event): void{
      let name: string = (event.target as SVGElement).id + "_low_legend";

      if( document.getElementById(name) !== null){
        document.getElementById(name)?.classList.add("marked_legend");
      }
    }

    function removeAllChildNodes() {

      while (displayFront.firstChild) {
        displayFront.removeChild(displayFront.firstChild);
      }
    }

  </script>
      <ThemeContext bind:theme={theme}>
          <div id="{idChart}" class="wrapper">
            <div bind:this="{headerChartParentTag}" class="chart_title">

            </div>
            <div class="chart_desc">
              <p aria-label="{chartInfo.desc}" tabindex="0" role="note">{chartInfo.desc}</p>
            </div>
            <div class="svg_wrap">
              <svg
                class="chart"
                role="graphics-document"
                aria-labelledby="{idChart}_desc_chart"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="{-(dimension.resolution*dimension.zoom)/2} {-(dimension.resolution*dimension.zoom)/2} {dimension.resolution*dimension.zoom} {dimension.resolution*dimension.zoom}"
                width="{dimension.width}" height="{dimension.height}"
              >
                <title id="{idChart}_title_chart">{chartInfo.title}</title>
                <desc id="{idChart}_desc_chart">{chartInfo.desc}</desc>
                <g>
                  {#if series.slices !== undefined}
                    {#each series.slices as slice, index }
                      <path
                        id="{idChart}_{slice.name}_slice"
                        class="slice"
                        transform="rotate(-90)"
                        role="graphics-symbol"
                        aria-label="This slice of pie chart has {slice.percent}%. The name of the slice is {slice.name}. This is slice {index+1} of {series.slices.length}"
                        tabindex="0"
                        on:blur="{(event) => {removeAllChildNodes(); unmaskLegend(event);}}"
                        on:focus="{event => {moveSliceForward(event); markLowLegend(event);}}"
                        fill="{slice.color ? slice.color : colors[index]}"
                        d="{'M ' + calculateXPositionOnCircleByPercent(cumulativePercents[index])*dimension.resolution/2 + " "
                          + calculateYPositionOnCircleByPercent(cumulativePercents[index]) *dimension.resolution/2
                          + " A " + dimension.resolution/2 + " " + dimension.resolution/2 + " 0 " + calculateLargeArcFlagByPercent(slice.percent) + " 1 "
                          + calculateXPositionOnCircleByPercent(cumulativePercents[index] + slice.percent)*dimension.resolution/2 + " "
                          + calculateYPositionOnCircleByPercent(cumulativePercents[index] + slice.percent)*dimension.resolution/2 + "L 0 0 L"
                          + calculateXPositionOnCircleByPercent(cumulativePercents[index])*dimension.resolution/2 + " "
                          + calculateYPositionOnCircleByPercent(cumulativePercents[index])*dimension.resolution/2}"
                      >
                      </path>
                      <!-- svelte-ignore component-name-lowercase -->
                      {#if slice.percent > 0.05}
                        <text class="pie_chart_text"
                              dominant-baseline="{
                          cumulativePercents[index+1] - (slice.percent/2) > 0.25
                          && cumulativePercents[index+1] - (slice.percent/2) < 0.75
                          ? 'hanging':'auto'
                        }"
                              text-anchor="{
                          cumulativePercents[index+1] - (slice.percent/2) > 0.5
                          && cumulativePercents[index+1] - (slice.percent/2) < 1 ? 'end':'start'
                          }"
                              x="{calculateXPositionOnCircleByPercent(
                          (cumulativePercents[index+1] - (slice.percent/2)) + 0.75)*(dimension.resolution/2)*1.1
                          }"
                              y="{calculateYPositionOnCircleByPercent(
                          (cumulativePercents[index+1] - (slice.percent/2)) + 0.75)*(dimension.resolution/2)*1.1
                          }"
                        >
                          {slice.name + " " + slice.percent + "%"}
                        </text>
                      {/if}
                    {/each}
                  {:else}
                    <text text-anchor="middle" class="no_series_text" x="0" y="0">No series available</text>
                  {/if}
                </g>
                <g class="legend">
                  {#if series.slices !== undefined}
                    {#each series.slices as slice, index }
                      {#if slice.percent <= 0.05}
                        <circle fill="{slice.color ? slice.color : colors[index]}" cx="{-(dimension.resolution*dimension.zoom*1.25)}" cy="{(-(dimension.resolution*dimension.zoom*1.15)/2)*(1-(index*0.15))-10}" r="10"/>
                        <text
                          id="{idChart}_{slice.name}_slice_low_legend"
                          class="pie_chart_text" x="{-(dimension.resolution*dimension.zoom*1.2)}"
                          y="{(-(dimension.resolution*dimension.zoom*1.1)/2)*(1-(index*0.15))}">
                          {slice.name + " " + slice.percent + "%"}
                        </text>
                      {/if}
                    {/each}
                  {/if}
                </g>
                <g class="display_front" bind:this="{displayFront}">

                </g>
              </svg>
            </div>
            {#if chartInfo.source !== ''}
              <div class="source">
                <a
                tabindex="0"
                aria-label="Read more about the source of the diagram and visit the website {chartInfo.source}"
                href="{chartInfo.source}">Source: {chartInfo.source}</a>
              </div>
            {/if}
          </div>
      </ThemeContext>
<style>

  :global(.marked_legend){
    text-decoration: underline var(--focusColor) 3px;
    z-index: 1000;
  }

  .wrapper{
    background-color: var(--wrapperStyles-backgroundColor);
    display: inline-block;
  }

  .no_series_text{
    font-size: 3em;
    margin: auto;
    text-align: center;
    margin-top: 40px;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .pie_chart_text{
    font-size: 3em;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .slice{
    outline: none;
  }

  .display_front{
    rotate: -90deg;
  }

  :global(.show_slice_border){
    stroke: var(--focusColor);
    outline: none;
    stroke-width: 20px;
    stroke-linecap: square;
    fill: none !important;
    border: none !important;
    color: none;
  }

  .source{
    font-size: 9px;
    text-align: right;
    padding-right: 10px;
    padding-bottom: 2px;
  }

  .chart_title{
    text-align: center !important;
  }

  .chart_desc{
    text-align: center;
  }
</style>
