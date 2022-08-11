<script lang="ts">
    import { onMount } from 'svelte';
    import {generateId} from '../utils/common';
    import ThemeContext from '../theme/ThemeContext.svelte';
    import type {PieSeries, PieSlice} from './../types/series/PieSeries.Type';
    import type {PieTheme} from '../types/theme/Theme.type';
    import {testPieTheme} from '../theme/defaultTheme';
    import {testPieSeries} from '../example_data/pie_series';
    import {createHeaderTagForElement} from '../utils/accessibles';
    import {
      calculateLargeArcFlagByPercent, 
      calculateXPositionOnCircleByPercent, 
      calculateYPositionOnCircleByPercent
    } from '../math/circleGeometry';

    export let title: string = '';
    export let desc: string = "";
    export let theme: PieTheme = testPieTheme;
    export let width: string = "800";
    export let height: string = "300";
    export let series: PieSeries = testPieSeries;
    export let source: string = "";
  
    var svgWidth: number = 0;
    var svgHeight: number = 0;
    var colors: any[];
    var showedInfoBox: SVGGElement;
    var idChart: string;
    var verticalInterceptionGroup: SVGGElement;
    var rootNode: HTMLElement;
    var headerChartParentTag: HTMLElement;
    let cumulativePercents:number[]  = partialSum(series.slices);
    let displayFront:SVGElement;  

    function partialSum(series:PieSlice[], unshiftZero:boolean = true){
      
      let partialSliceSums:number[] = Array(series.length).fill(0);

      for(let i = 0; i<series.length; i++){

        if(i === 0){
          partialSliceSums[i] = series[i].percent;
        }
        else{

          partialSliceSums[i] = partialSliceSums[i-1] + series[i].percent;
        }
      }

      if(unshiftZero) {partialSliceSums.unshift(0);}

      return partialSliceSums;
    }

    onMount(async () => {

      colors = Object.values(theme.colors);
      idChart = generateId(); 
      createHeaderTagForElement(headerChartParentTag, title);
    });
  
    function moveSliceForward(event: Event){

      let slice: SVGElement = (event.target as SVGElement);
      //console.log(slice.getAttribute('d'));
      
      let sliceBorder: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      sliceBorder.setAttribute('d', slice.getAttribute('d')!.toString());
      sliceBorder.classList.add('show_slice_border');
      
      displayFront.appendChild(sliceBorder);

    }

    function removeAllChildNodes() {
      
      while (displayFront.firstChild) {
        displayFront.removeChild(displayFront.firstChild);
        console.log('remove');
      }
    }
  
  </script>
      <ThemeContext>
          <div id="{idChart}" bind:this="{rootNode}" class="wrapper">
            <div bind:this="{headerChartParentTag}" class="chart_title">
              
            </div>
            <div class="chart_desc" tabindex="0" role="document">
              {desc}
            </div>
            <div class="svg_wrap" bind:clientWidth="{svgWidth}" bind:clientHeight="{svgHeight}">
              <svg 
                class="chart" 
                role="graphics-document"
                aria-labelledby="{idChart}_desc_chart"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="-1.25 -1.25 2.5 2.5" 
                width="{width}" height="{height}"
              >
                <title id="{idChart}_title_chart">{title}</title>
                <desc id="{idChart}_desc_chart">{desc}</desc>
                <g>
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
                </g>
                <g class="display_front" bind:this="{displayFront}">

                </g>
              </svg>
            </div>
            <div class="source">
              <a tabindex="0" href="{source}">Source: {source}</a>
            </div>  
          </div>
      </ThemeContext>
<style>

  .wrapper{
    background-color: #f7f7f7;
    display: inline-block;
  }

  .pie_chart_text{
    font-size: 0.12px;
  }

  .slice{
    outline: none;
  }

  .display_front{
    rotate: -90deg;
  }

  :global(.show_slice_border){
    stroke: #646464;
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