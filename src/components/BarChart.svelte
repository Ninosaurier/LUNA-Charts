

<script lang="ts">

    import { onMount } from 'svelte';
    import ThemeContext from '../core/ThemeContext.svelte';
    import {defaultBarTheme} from '../theme/defaultTheme';
    import {createHeaderTagForElement} from '../utils/accessibles';
    import {generateId} from '../utils/common';
    import type { BarTheme, Colors } from '../types/theme/Theme.type';
    import type { BarSeries } from '../types/series/BarSeries.type';
    import Hatch from '../hatches/Hatch.svelte';

    export let title: string = '';
    export let desc: string = "";
    export let theme: BarTheme = defaultBarTheme;
    export let width: string = "800";
    export let height: string = "300";
    export let yLabel: string = 'Y-Axis';
    export let xLabel: string = 'X-Axis';
    export let secondYLabel: string = 'Second Y-Axis';
    export let series: BarSeries = {} as BarSeries;
    export let source: string = "";
    export let hatchPatterns: boolean = false;

    let svgWidth: number = 0;
    let svgHeight: number = 0;
    let idChart: string;
    let headerChartParentTag: HTMLElement;
    let gridGap: number = 20;
    let barGap: number = 6;
    let test: any;
    let barGroupSize: number = calculateBarGroupSize();

    onMount(async () => {

        idChart = generateId();
        console.log('BarChart: ', test);
        console.log('BarChart: ', headerChartParentTag);
        createHeaderTagForElement(headerChartParentTag, title);
    });

    function cleanIdName(name: string){

      return name.replace(/\s/g, "");
    }

    function calculateBarGroupSize(): number{
      
      if(!isSeriesEmpty(series)){
        return (parseInt(width)*0.75/series.category.length) - barGap*2;
      }
      
      return 0;
    }

    function calculateBarSize(): number{

      if (!isSeriesEmpty(series)){

        return barGroupSize/series.series.length;
      }

      return 0;
    }

    function toggleBars(event: Event){

      let button = event.target as HTMLButtonElement;
      let bars = document.getElementsByClassName(button.value + '_bar');

      if(button.classList.contains('inactive')){

        button.classList.remove('inactive');
        for(let numberOfBar = 0; numberOfBar < bars.length; numberOfBar++){

          bars[numberOfBar].classList.replace('hide_bar','show_bar');
        }
      }
      else{

        button.classList.add('inactive');
        for(let numberOfBar = 0; numberOfBar < bars.length; numberOfBar++){

          bars[numberOfBar].classList.replace('show_bar','hide_bar');
        }
      
      }     
    }

    function isSeriesEmpty(series: BarSeries): boolean{

      if (series.series === undefined){
        return true;
      }

      return false;
    }

</script>
<ThemeContext bind:theme={theme}>
    <div bind:this="{test}" class="wrapper">
        <div bind:this={headerChartParentTag} class="chart_title">
        </div>
        <div tabindex="0" class="chart_desc" role="document" aria-labelledby="{idChart}_desc_chart">
            {desc}
        </div>
        <div class="svg_wrap" bind:clientWidth="{svgWidth}" bind:clientHeight="{svgHeight}">
          <svg class="chart" role="graphics-document" xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
            <title id="{idChart}_title_chart">{title}</title>
            <desc id="{idChart}_desc_chart">{desc}</desc>
            <defs>
              <pattern id="{idChart}_grid_pattern"  width="{gridGap}" height="{gridGap}" patternUnits="userSpaceOnUse">
                  <path class="grid_path" d="M 0 {gridGap} H 0 {gridGap}" fill="none" stroke-width="0.5"/>
              </pattern>
            </defs>
            <defs>
              {#if !isSeriesEmpty(series) && hatchPatterns}
                {#each theme.hatches as hatch, hatchIndex}
                <Hatch 
                  pattern="{hatch}" 
                  color="{theme.colors[hatchIndex]}"
                  idPattern="{
                    series.series[hatchIndex] === undefined ? 
                    '' : idChart + '_pattern_' + series.series[hatchIndex].name 
                    }" 
                />
                {/each}
              {/if}
            </defs>
            <g role="none" aria-hidden="true">
              <rect width="90%" class="background-chart"></rect> 
            </g>
            <g class="grid" transform='translate({svgWidth*0.1},{svgHeight*0.1})'>
              <rect class="grid_surface" height="{svgHeight*0.7}" fill="url(#{idChart}_grid_pattern)" transform="scale(1, 1)"></rect>
            </g>
            <g class="axis" aria-hidden="true">
              <line class="" x1="10%"  x2="10%" y1="10%" y2="80%" stroke="black"/>
              <line class="" x1="10%"  x2="85%" y1="10%" y2="10%"  stroke="black"/>
              <line class="" x1="85%"  x2="85%" y1="10%" y2="80%" stroke="black"/>
            </g>
            <g class="labels">
              <g transform='translate({svgWidth*0.9},{svgHeight*0.1}) scale(0.2 , 0.2)'>
                <text class="x_label">{xLabel}</text>
              </g>
              <g transform='translate(0,{svgHeight*0.8}) scale(0.2 , 0.2)'>
                <text class="y_label" x="50%" y="15%">{yLabel}</text>
              </g>
              <g transform='translate({svgWidth*0.7},{svgHeight*0.8}) scale(0.3 , 0.2)'>
                <text class="second_y_label" x="50%" y="15%">{secondYLabel}</text>
              </g>
            </g>
            <g class="y_grid_label" transform="translate(1, {svgHeight*0.1})" >
              {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
                <text 
                  text-anchor="end" 
                  alignment-baseline="central"  
                  x="5%" 
                  y="{(gridGap*i*-1)}"
                >
                  {gridGap*i}
                </text>
              {/each}
            </g>
            <g class="x_grid_label" transform="translate({svgWidth*0.1}, 0)">     
            </g>
            <g role="graphics-object" transform='translate({svgWidth*0.1},{svgHeight*0.1})' class="functions">
              {#if !isSeriesEmpty(series)}
                {#each series.category as category, c}
                  <g transform='translate({barGap*2*c},0)'>
                    {#each series.series as bar, barIndex}
                      <rect 
                        stroke="{theme.colors[barIndex]}"
                        style="stroke-width:4;"
                        class="{bar.name}_bar show_bar"
                        fill="{hatchPatterns ? 'url(#' + idChart + '_pattern_' + bar.name +')' : theme.colors[barIndex]}" 
                        tabindex="0" 
                        x="{(c*barGroupSize)+(calculateBarSize()*barIndex)}" 
                        width="{calculateBarSize()}" 
                        height="{bar.barValues[barIndex].value}">
                      </rect>
                      {/each}
                      <g transform="translate({(c*barGroupSize)+(calculateBarSize())-(barGroupSize*0.1)},{svgHeight*0.05*(-1)})">
                        <text 
                        text-anchor="start" 
                        class="x_grid_text_label">
                        {category}
                        </text>
                      </g>
                  </g>
                {/each}
              {/if}
            </g>
          </svg>
        </div>
        <div class="captions" style="padding: 0 {svgWidth*0.1}px;">
          {#if !isSeriesEmpty(series)}
            {#each series.series as barSeries, l}
              <button 
                tabindex="0" 
                value="{barSeries.name}" 
                id="{idChart}_{cleanIdName(barSeries.name)}" 
                aria-label="{barSeries.name}" 
                class="caption" on:click="{
                  (event) => toggleBars(event)
                  }"
              >
                <span class="dot" style="background-color: {theme ? theme.colors[l]:'#ccc'};"></span>   
                  {barSeries.name}
              </button>
            {/each}
          {/if}
        </div>
        <div class="source">
          <a tabindex="0" href="{source}">Source: {source}</a>
        </div>
    </div>
</ThemeContext>
    

<style>

  .x_grid_text_label{
    transform: scale(1, -1);
    font-size: 9px;
  }

  .wrapper{
    background-color: var(--wrapperStyles-backgroundColor);
    display: inline-block;
  }

  .chart{
    transform: scale(1,-1);
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .grid_surface{
    width: 75%;
  }

  .grid{
    width: 80%;
  }

  .grid_path{
    stroke: darkgray;
  }

  .x_label{
    transform:  scale(5, -5)  !important;
    transform-origin: center center;
    transform-box: fill-box;
    font-size: 14px;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .y_label{
    transform:  scale(5, -5)  !important;
    transform-origin: center center;
    transform-box: fill-box;
    text-anchor: middle;
    font-size: 14px;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .second_y_label{
    transform:  scale(3, -5)  !important;
    transform-origin: center center;
    transform-box: fill-box;
    font-size: 14px;
    text-anchor: middle;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .captions{
    margin: 10px 0 0 0;
    display: flex;
    flex-direction: row;
    gap:5px;
  }
  .caption{
    flex-wrap: nowrap;
    margin: 5px;
    padding: 0 10px;
    background-color: #fff;
    box-shadow:  0px 0px 1px 1px lightgray;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
  }

  :global(.inactive > .dot){
    background-color: gray !important;
  }

  :global(.inactive){
    color: gray;
    opacity: 0.7;
  }

  .y_grid_label > text{
    transform: scale(1, -1);
    font-size: 12px;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .x_grid_text_label{
    font-size: 11px;
    letter-spacing: 0.2em;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  :global(.hide_bar){
    display: none !important;
  }

  :global(.show_bar){
    display: block !important;
    stroke-width: 2px !important;
  }

  .dot {
    height: 10px;
    width: 10px;
    border-radius: 50%;
    display: inline-block;
    pointer-events: none;
  }  

  .source{
    font-size: 9px;
    text-align: right;
    padding-right: 10px;
    padding-bottom: 2px;
  }

  .chart_title{
    text-align: center;
  }

  .chart_desc{
    text-align: center !important;
  }
</style>