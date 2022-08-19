<script lang="ts">
    import { onMount } from 'svelte';
    import {generateId} from '../utils/common';
    import ThemeContext from '../core/ThemeContext.svelte';
    import type {PieSeries, PieSlice} from './../types/series/PieSeries.Type';
    import type {PieTheme} from '../types/theme/Theme.type';
    import {defaultPieTheme} from '../theme/defaultTheme';
    import {createHeaderTagForElement} from '../utils/accessibles';
    import type {ChartInfo} from '../types/attributes/ChartInfo.types';
    import type {Dimension} from '../types/attributes/Dimension.type';
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
    export let dimension: Dimension = {width: "800", height: "300"} as Dimension;
    export let series: PieSeries = {} as PieSeries;
  
    let colors: any[];
    let idChart: string;
    let headerChartParentTag: HTMLElement;
    let cumulativePercents:number[]  = partialSum(series.slices);
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
  
    function moveSliceForward(event: Event){

      let slice: SVGElement = (event.target as SVGElement);
      
      let sliceBorder: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      sliceBorder.setAttribute('d', slice.getAttribute('d')!.toString());
      sliceBorder.classList.add('show_slice_border');
      
      displayFront.appendChild(sliceBorder);

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
            {#if series.slices === undefined}
              <div                 
              role="note"
              aria-label="No series available"
              tabindex="0" 
              class="no_series_text">
                  No series available
              </div>
            {/if}
            <div class="svg_wrap">
              <svg 
                class="chart" 
                role="graphics-document"
                aria-labelledby="{idChart}_desc_chart"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="-1.25 -1.25 2.5 2.5" 
                width="{dimension.width}" height="{dimension.height}"
              >
                <title id="{idChart}_title_chart">{chartInfo.title}</title>
                <desc id="{idChart}_desc_chart">{chartInfo.desc}</desc>
                <g>
                  {#if series.slices !== undefined}
                    {#each series.slices as slice, index }
                      <path 
                        class="slice"
                        transform="rotate(-90)"
                        role="graphics-symbol"
                        aria-label="This slice of pie chart has {slice.percent}%. This is slice {index+1} of {series.slices.length}" 
                        tabindex="0"
                        on:blur="{() => removeAllChildNodes()}" 
                        on:focus="{event => moveSliceForward(event)}"
                        fill="{colors ? colors[index] : '#000'}"
                        d="{'M ' + calculateXPositionOnCircleByPercent(cumulativePercents[index]) + " " 
                          + calculateYPositionOnCircleByPercent(cumulativePercents[index])
                          + " A 1 1 0 " + calculateLargeArcFlagByPercent(slice.percent) + " 1 " 
                          + calculateXPositionOnCircleByPercent(cumulativePercents[index] + slice.percent) + " " 
                          + calculateYPositionOnCircleByPercent(cumulativePercents[index] + slice.percent) + "L 0 0 L"
                          + calculateXPositionOnCircleByPercent(cumulativePercents[index]) + " " 
                          + calculateYPositionOnCircleByPercent(cumulativePercents[index])}"
                      >
                      </path>
                      <!-- svelte-ignore component-name-lowercase -->
                      <text id="{idChart}_{slice.name}_slice" class="pie_chart_text"
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
                          (cumulativePercents[index+1] - (slice.percent/2)) + 0.75)*1.1
                          }" 
                        y="{calculateYPositionOnCircleByPercent(
                          (cumulativePercents[index+1] - (slice.percent/2)) + 0.75)*1.1
                          }"
                        >
                        {slice.name}
                      </text>
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

  .wrapper{
    background-color: var(--wrapperStyles-backgroundColor);
    display: inline-block;
  }

  .no_series_text{
    font-size: 18px;
    
    margin: auto;
    text-align: center;
    margin-top: 40px;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .pie_chart_text{
    font-size: 0.12px;
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
    stroke-width: 0.05px;
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