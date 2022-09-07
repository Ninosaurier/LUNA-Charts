<script lang="ts">

  import { onMount } from 'svelte';
  import ThemeContext from '../core/ThemeContext.svelte';
  import {defaultLineTheme} from '../theme/defaultTheme';
  import type { LineSeries, Points } from '../types/series/LineSeries.type';
  import type {LineTheme} from '../types/theme/Theme.type';
  import {createHeaderTagForElement} from '../utils/accessibles';
  import {generateId} from '../utils/common';
  import type {ChartInfo} from '../types/attributes/ChartInfo.type';
  import type {Dimension} from '../types/attributes/Dimension.type';
  import {type Labels, defaultLabel} from '../types/attributes/Labels.type';

  export let labels: Labels = defaultLabel;
  export let chartInfo: ChartInfo = {
      title: "Line chart title",
      desc: "This description is accessible and your screenreader will detect it.",
      source: ""
    } as ChartInfo
  export let theme: LineTheme = defaultLineTheme;
  export let dimension: Dimension = {width: "600", height: "200"} as Dimension;
  export let series: LineSeries[] = [];


  let svgWidth: number = 0;
  let svgHeight: number = 0;
  let showedInfoBox: SVGGElement;
  let idChart: string;
  let verticalInterceptionGroup: SVGGElement;
  let headerChartParentTag: HTMLElement;
  let gridGap: number = 20;


  var getPoints = (points: Points[]) : string => {

    let polyPoints: string = '';

    points.forEach(function (point: any) {

      polyPoints += point.x + "," + point.y + " ";
    });

    return polyPoints;
  }

	onMount(async () => {

    idChart = generateId();
    createHeaderTagForElement(headerChartParentTag, chartInfo.title);
	});

  function removeAllChildNodes(parent: SVGGElement) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
  }

  function showInfoBox(event: Event){

    let element: SVGGElement = (event.target) as SVGGElement;
    element = element.nextSibling?.cloneNode(true) as SVGGElement;

    element.classList.add('show_info');
    element.classList.remove('blur_info');
    showedInfoBox.appendChild(element);

  }

  function blurInfoBox(){
    removeAllChildNodes(showedInfoBox);
  }

  function toogleLine(event: Event){

    if(verticalInterceptionGroup.firstChild){verticalInterceptionGroup.removeChild(verticalInterceptionGroup.firstChild); }
    let button = event.target as HTMLElement;

    let targetId: string = button.id.replace(/\s/g, "").replace('-caption', '');
    let line: HTMLElement =  document.getElementById(targetId) as HTMLElement;

    if(line.classList.contains('show_line')){
      line.classList.replace('show_line','hide_line');
      button.classList.replace('active','inactive');
      button.setAttribute('aria-expanded', 'false');
    }
    else{
      line.classList.replace('hide_line','show_line');
      button.classList.replace('inactive','active');
      button.setAttribute('aria-expanded', 'true');
    }
  }

  function showVerticalInterception(event: Event){

    let circle = event.target as SVGAElement;
    let bbox = circle.getBBox();

    let interception = document.createElementNS('http://www.w3.org/2000/svg','line');

    interception.setAttribute('x1', (bbox.x + (bbox.width / 2)).toString());
    interception.setAttribute('x2', (bbox.x + (bbox.width / 2)).toString());
    interception.setAttribute('y1', (svgHeight*0.1).toString());
    interception.setAttribute('y2', (svgHeight*0.8).toString());
    interception.setAttribute('stroke', 'black');

    verticalInterceptionGroup.appendChild(interception);

  }

  function removeVerticalInterception(){
    if(verticalInterceptionGroup.firstChild){
      verticalInterceptionGroup.removeChild(verticalInterceptionGroup.lastChild as Node);
    }
  }

  function cleanIdName(name: string){

    return name.replace(/\s/g, "");
  }

  function isSeriesEmpty(series: LineSeries[]): boolean{

    if (series.length !== 0){
      return false;
    }

    return true;
  }

</script>

<ThemeContext bind:theme={theme}>
  <div class="wrapper" >
    <div bind:this="{headerChartParentTag}" class="chart_title">
    </div>
    <div tabindex="0" role="note" class="chart_desc" aria-label="{chartInfo.desc}">
      {chartInfo.desc}
    </div>
    <div class="svg_wrap" bind:clientWidth="{svgWidth}" bind:clientHeight="{svgHeight}">
      <svg
        class="chart"
        role="graphics-document"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 600 200"
        width="{dimension.width}"
        height="{dimension.height}">
        <title id="{idChart}_title_chart">{chartInfo.title}</title>
        <desc id="{idChart}_desc_chart">{chartInfo.desc}</desc>
        <defs>
          <pattern id="{idChart}_grid_pattern"  width="{gridGap}" height="{gridGap}" patternUnits="userSpaceOnUse">
              <path class="grid_path" d="M 0 {gridGap} L 0 0 {gridGap} 0" fill="none" stroke-width="0.5"/>
          </pattern>
        </defs>
        <defs>
          <filter x="0" y="0" width="1" height="1" id="info_box">
            <feFlood flood-color="white" result="bg" />
            <feMerge>
              <feMergeNode in="bg"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g role="none" aria-hidden="true">
          <rect width="90%" class="background-chart"></rect>
        </g>
        <g class="grid" transform='translate({svgWidth*0.1},{svgHeight*0.1}) ' aria-hidden="true">
          {#if !isSeriesEmpty(series)}
            <rect
              class="grid_surface"
              height="{svgHeight*0.7}"
              fill="url(#{idChart}_grid_pattern)"
              transform="scale(1, 1)">
            </rect>
          {/if}
        </g>
        <g class="labels">
          <g transform='translate({svgWidth*0.9},{svgHeight*0.1}) scale(0.2 , 0.2)'>
            <text class="x_label">{labels.x}</text>
          </g>
          <g transform='translate(0,{svgHeight*0.8}) scale(0.2 , 0.2)'>
            <text class="y_label" x="50%" y="15%">{labels.y}</text>
          </g>
          <g transform='translate({svgWidth*0.7},{svgHeight*0.8}) scale(0.3 , 0.2)'>
            <text class="second_y_label" x="50%" y="15%">{labels.y}</text>
          </g>
        </g>
        <g class="axis" aria-hidden="true">
          <line class="" x1="10%"  x2="10%" y1="10%" y2="80%" stroke="black"/>
          <line class="" x1="10%"  x2="85%" y1="10%" y2="10%"  stroke="black"/>
          <line class="" x1="85%"  x2="85%" y1="10%" y2="80%" stroke="black"/>
        </g>
        <g class="grid_label" transform="translate(1, {svgHeight*0.1})" >
          {#if !isSeriesEmpty(series)}
            {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
              <text text-anchor="middle" alignment-baseline="central"  x="5%" y="{(gridGap*i*-1)}">{gridGap*i}</text>
            {/each}
            {#each Array(Math.floor((svgWidth*0.8)/gridGap)) as _, i}
              {#if i%2 == 0}
              <text text-anchor="middle"  x="{(gridGap*i)+(svgWidth*0.1)}" y="7%">{gridGap*i}</text>
              {/if}
            {/each}
          {/if}
        </g>
        <g id="vertical_intercept" bind:this="{verticalInterceptionGroup}" transform='translate({svgWidth*0.1},0)'>

        </g>
        <g transform='translate({svgWidth*0.1},{svgHeight*0.1})' class="functions" aria-live="polite">
          {#if series.length !== 0}
            {#each series as lines, l}
              <g id="{idChart}_{cleanIdName(lines.name)}" class="show_line">
                <polyline 
                  points="{getPoints(lines.points)}" 
                  fill="none" 
                  stroke='{theme ? theme.colors[l]:'black'}'
                  />
                {#each lines.points as point, p}
                  <circle
                  on:focus="{(event) => {showInfoBox(event); showVerticalInterception(event);}}"
                  on:blur="{() => {blurInfoBox(); removeVerticalInterception()}}"
                  tabindex="0"
                  class="point"
                  role="graphics-symbol"
                  aria-label="{point.ariaLabel}. Values are: {point.x},{point.y}. This is point {p+1} of {lines.points.length} from {lines.name}."
                  stroke="{theme ? theme.colors[l]:'black'}"
                  fill="{theme ? theme.colors[l]:'black'}"
                  cx="{point.x}"
                  cy="{point.y}"
                  r="3"/>

                  <text class="info blur_info" filter="url(#info_box)" x="{point.x+20}" y="{point.y*-1}" stroke="{theme ? theme.colors[l]:'black'}">{point.x},{point.y}</text>
                {/each}

              </g>
            {/each}
          {:else}
            <text
              x="25%"
              y="-30%"
              tabindex="0"
              role="note"
              class="no_series_label"
              aria-label="No series available">
              No series available
            </text>
          {/if}
        </g>
        <g bind:this="{showedInfoBox}" transform='translate({svgWidth*0.1},{svgHeight*0.1}) scale(1, -1)' id="actually_focus"></g>
      </svg>
    </div>
    <div class="captions" style="padding: 0 {svgWidth*0.1}px;">
      {#if series.length !== 0}
        {#each series as line, l}
          <button 
            tabindex="0"
            aria-expanded="true" 
            id="{idChart}_{cleanIdName(line.name) + '-caption'}" 
            aria-label="{line.name}. Toggles the {line.name} lines." 
            class="caption active" 
            on:click="{(event) => toogleLine(event)}">
            <span class="dot" style="background-color: {theme ? theme.colors[l]:'#ccc'};"></span>
              {line.name}
          </button>
        {/each}
      {/if}
    </div>
    {#if chartInfo.source !== ''}
      <div class="source">
        <a tabindex="0" aria-label="Read more about the source of the diagram and visit the website {chartInfo.source}" href="{chartInfo.source}">Source: {chartInfo.source}</a>
      </div>
    {/if}
  </div>
</ThemeContext>
<style>

  .wrapper{
    background-color: var(--wrapperStyles-backgroundColor);
    display: inline-block;
  }

  .svg_wrap{
    display: inline-block;
  }

  circle:focus{
    outline: var(--circles-focusColor);
    outline-style: solid;
    outline-width: 2px;
    border-radius: var(--circles-focusRadius);
    text-anchor: middle;
  }

  .background-chart{
      fill: none;
      width: 100%;
      height: 100%;
  }

  .chart{
      transform: scale(1,-1);
      width: 100%;
      height: 100%;
      overflow: visible;
  }

  .grid_surface{
      width: 75%;
      height: 70%;
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
    border: none;
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

  .grid_label > text{
    transform: scale(1, -1);
    font-size: 11px;
    background-color: var(--wrapperStyles-backgroundColor);
  }

  .show_line{
    visibility:visible;
  }

  :global(.hide_line){
    display: none !important;
  }

  .show_info{
    display: block  !important;
  }

  .info{
    font-size: 9px !important;
    font-weight: lighter;
    letter-spacing: 2px;
  }

  .blur_info{
    display: none;
  }

  .source{
    font-size: 9px;
    text-align: right;
    padding-right: 10px;
    padding-bottom: 2px;
  }

  polyline{
    visibility: visible;
  }

  .dot {
    height: 10px;
    width: 10px;
    border-radius: 50%;
    display: inline-block;
    pointer-events: none;
  }

  .chart_title{
    text-align: center;
  }

  .chart_desc{
    text-align: center !important;
  }
</style>
