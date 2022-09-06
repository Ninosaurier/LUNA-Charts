<script lang="ts">

    import { onMount } from 'svelte';
    import ThemeContext from '../core/ThemeContext.svelte';
    import {defaultBarTheme} from '../theme/defaultTheme';
    import {createHeaderTagForElement} from '../utils/accessibles';
    import {generateId} from '../utils/common';
    import type { BarTheme } from '../types/theme/Theme.type';
    import type { BarSeries } from '../types/series/BarSeries.type';
    import Hatch from '../hatches/Hatch.svelte';
    import type {ChartInfo} from '../types/attributes/ChartInfo.type';
    import type {Dimension} from '../types/attributes/Dimension.type';
    import {type Labels, defaultLabel} from '../types/attributes/Labels.type';

    export let labels: Labels = defaultLabel;
    export let chartInfo: ChartInfo = {
      title: "Bar chart title",
      desc: "This description is accessible and your screenreader will detect it.",
      source: ""
    } as ChartInfo
    export let theme: BarTheme = defaultBarTheme;
    export let dimension: Dimension = {width: "800", height: "300"} as Dimension;
    export let series: BarSeries = {} as BarSeries;
    export let hatchPatterns: boolean = false;

    let svgWidth: number = 0;
    let svgHeight: number = 0;
    let idChart: string;
    let headerChartParentTag: HTMLElement;
    let gridGap: number = 20;
    let barGap: number = 6;
    let barGroupSize: number = calculateBarGroupSize();

    onMount(async () => {

        idChart = generateId();
        createHeaderTagForElement(headerChartParentTag, chartInfo.title);
    });

    function cleanIdName(name: string){

      return name.replace(/\s/g, "");
    }

    function calculateBarGroupSize(): number{

      if(!isSeriesEmpty(series)){
        return (parseInt(dimension.width)*0.75/series.category.length) - barGap*2;
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
        button.setAttribute("aria-expanded", "true");
        for(let numberOfBar = 0; numberOfBar < bars.length; numberOfBar++){

          bars[numberOfBar].classList.replace('hide_bar','show_bar');
        }
      }
      else{

        button.classList.add('inactive');
        button.setAttribute("aria-expanded", "false");
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
    <div class="wrapper">
        <div bind:this="{headerChartParentTag}" class="chart_title">
        </div>
        <div tabindex="0" class="chart_desc" role="note" aria-label="{chartInfo.desc}">
            {chartInfo.desc}
        </div>
        <div class="svg_wrap" bind:clientWidth="{svgWidth}" bind:clientHeight="{svgHeight}">
          <svg
          class="chart"
          role="graphics-document"
          xmlns="http://www.w3.org/2000/svg"
          width="{dimension.width}"
          height="{dimension.height}">
            <title id="{idChart}_title_chart">{chartInfo.title}</title>
            <desc id="{idChart}_desc_chart">{chartInfo.desc}</desc>
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
            {#if !isSeriesEmpty(series)}
              <g class="grid" transform='translate({svgWidth*0.1},{svgHeight*0.1})'>
                <rect class="grid_surface" height="{svgHeight*0.7}" fill="url(#{idChart}_grid_pattern)" transform="scale(1, 1)"></rect>
              </g>
            {/if}
            <g class="axis" aria-hidden="true">
              <line class="" x1="10%"  x2="10%" y1="10%" y2="80%" stroke="black"/>
              <line class="" x1="10%"  x2="85%" y1="10%" y2="10%"  stroke="black"/>
              <line class="" x1="85%"  x2="85%" y1="10%" y2="80%" stroke="black"/>
            </g>
            <g class="labels">
              <g transform='translate({svgWidth*0.9},{svgHeight*0.1}) scale(0.2 , 0.2)'>
                <text class="x_label">{labels.x}</text>
              </g>
              <g transform='translate(0,{svgHeight*0.8}) scale(0.2 , 0.2)'>
                <text class="y_label" x="50%" y="15%">{labels.y}</text>
              </g>
              <g transform='translate({svgWidth*0.7},{svgHeight*0.8}) scale(0.3 , 0.2)'>
                <text class="second_y_label" x="50%" y="15%">{labels.secondY}</text>
              </g>
            </g>
            <g class="y_grid_label" transform="translate(1, {svgHeight*0.1})" >
              {#if !isSeriesEmpty(series)}
                {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
                  <text
                    text-anchor="end"
                    alignment-baseline="central"
                    x="5%"
                    y="{(gridGap*i*-1)}">
                    {gridGap*i}
                  </text>
                {/each}
              {/if}
            </g>
            <g class="second_y_grid_label" transform="translate(1, {svgHeight*0.1})" >
              {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
                {#if i !== 0 && labels.secondY !== ''}
                  <text
                    text-anchor="end"
                    alignment-baseline="central"
                    x="90%"
                    y="{((gridGap)*i*-1)}">
                    {10*i}
                  </text>
                {/if}
              {/each}
            </g>
            <g role="graphics-object" transform='translate({svgWidth*0.1},{svgHeight*0.1})' class="functions">
              {#if !isSeriesEmpty(series)}
                {#each series.category as category, c}
                  <g transform='translate({barGap*2*c},0)' role="graphics-object" aria-live="polite">
                    {#each series.series as bar, barIndex}
                      <rect
                        stroke="{theme.colors[barIndex]}"
                        style="stroke-width:4;"                     
                        role="graphics-symbol"
                        class="{bar.name}_bar show_bar"
                        fill="{hatchPatterns ? 'url(#' + idChart + '_pattern_' + bar.name +')' : theme.colors[barIndex]}"
                        tabindex="0"
                        aria-label="{bar.barValues[c].ariaLabel + ' ' + bar.barValues[c].value}. This is bar {c+1} of {bar.barValues.length} of {bar.name}."
                        x="{(c*barGroupSize)+(calculateBarSize()*barIndex)}"
                        width="{calculateBarSize()}"
                        height="{bar.barValues[c].value}">
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
              {:else}
                  <text
                    x="30%"
                    y="-30%"
                    role="note"
                    tabindex="0"
                    class="no_series_label"
                    aria-label="No series available">
                    No series available
                  </text>
              {/if}
            </g>
          </svg>
        </div>
        <div class="captions" style="padding: 0 {svgWidth*0.1}px;">
          {#if !isSeriesEmpty(series)}
            {#each series.series as barSeries, l}
              <button
                tabindex="0"
                aria-expanded="true"
                value="{barSeries.name}"
                id="{idChart}_{cleanIdName(barSeries.name)}"
                aria-label="{barSeries.name}. Toggles the {barSeries.name} bars."
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
        {#if chartInfo.source !== ''}
          <div class="source">
            <a
              tabindex="0"
               aria-label="Read more about the source of the diagram and visit the website {chartInfo.source}"
               href="{chartInfo.source}">Source: {chartInfo.source}
            </a>
          </div>
        {/if}
    </div>
</ThemeContext>

<style>

  .no_series_label{
    transform: scale(1,-1);
    background-color: var(--wrapperStyles-backgroundColor);
  }

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
    border: none;
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

  .second_y_grid_label > text{
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

  :global(.show_bar:focus){
    stroke: var(--focusColor) !important;
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
