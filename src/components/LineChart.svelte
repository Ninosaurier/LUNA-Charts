<script lang="ts">

  import { onMount } from 'svelte';
  import ThemeContext from '../theme/ThemeContext.svelte';
  import {defaultTheme} from '../theme/defaultTheme';
  import type { Point } from '../types/Point.type';

  export let title: string = '';
  export let desc: string = "";
  export let theme: any = defaultTheme;
  export let width: string = "600";
  export let height: string = "200";
  export let yLabel: string = 'Y-Axis';
  export let xLabel: string = 'X-Axis';
  export let secondYLabel: string = 'Second Y-Axis';
  export let series: any = null;
  export let source: string = "";

  var svgImage: Element = null;
  var svgWidth: number = 0;
  var svgHeight: number = 0;
  var colors: any[];
  var showedInfoBox: SVGGElement;
  var idChart: string;
  var verticalInterceptionGroup: SVGGElement;
  var rootNode: HTMLElement;
  var headerChartParentTag: HTMLElement;
  var gridGap: number = 20;


  var getPoints = (points: Point[]) : string => {

    let polyPoints: string = '';

    points.forEach(function (point: any) {

      polyPoints += point.x + "," + point.y + " ";
    });

    return polyPoints;
  }
  
	onMount(async () => {

    console.log('onMount() (LineChart)');
    colors = Object.values(theme[0].color);
    idChart = generateId(); 
    createHeaderTag(findParentHeader());
	});

  function createHeaderTag(headerNumber: number){

    var newHeader: HTMLElement;

    if(headerNumber > 5){
      console.warn('Headline cannot be created. HTML allows only h1 - h6. The chart would get h'+ (++headerNumber));
    }else{

      console.log('Headernumber: ', headerNumber);

      if(headerNumber === null){
        console.warn('Creating a h1 header! Is this intended?');
        newHeader = document.createElement('h'+ (headerNumber +1));
      }
      else{
        newHeader = document.createElement('h'+ (headerNumber +1));
      }

      newHeader.setAttribute('tabindex', '0');
      newHeader.setAttribute('aria-labelledby', idChart+'_title_chart');
      newHeader.innerHTML = title;
      headerChartParentTag.appendChild(newHeader);
    }
  }

  function findParentHeader(): number{

    var parent: HTMLElement = rootNode.parentElement;
    var resultHeader: number = null;
    
    while(parent.tagName !== 'HTML' && resultHeader === null){

      Array.from(parent.children).reverse().forEach(element => {

        if(element.tagName.toLowerCase().match('h1|h2|h3|h4|h5|h6') && resultHeader === null){

          resultHeader =  parseInt(element.tagName[1]);
        }

      });
      
      parent = parent.parentElement;
    }

    return resultHeader;
  }

  function generateId(){

    return Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9*Math.pow(10, 12)).toString(36);
  }

  function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
  }

  function showInfoBox(event: Event){

    var element = (event.target as SVGGElement).nextSibling.cloneNode(true);

    element.classList.add('show_info');
    element.classList.remove('blur_info');
    showedInfoBox.appendChild(element);
  
  }

  function blurInfoBox(){
    removeAllChildNodes(showedInfoBox);
  }

  function toogleCaption(event: Event){

    if(verticalInterceptionGroup.firstChild){verticalInterceptionGroup.removeChild(verticalInterceptionGroup.firstChild); }
    var button = event.target as HTMLElement;

    var targetId: string = button.id.replace(/\s/g, "");
    var line =  document.getElementById(targetId);


    line.classList.contains('show_line') ? line.classList.replace('show_line','hide_line') : line.classList.replace('hide_line','show_line');
    button.classList.contains('inactive') ? button.classList.remove('inactive') : button.classList.add('inactive');
  }

  function showVerticalInterception(event: Event){

    var circle = event.target as SVGAElement;
    var bbox = circle.getBBox();

    var interception = document.createElementNS('http://www.w3.org/2000/svg','line');
    // var interceptionText = document.createElementNS('http://www.w3.org/2000/svg','text');

    // interceptionText.innerHTML = (bbox.x + (bbox.width / 2)).toString();
    // interceptionText.setAttribute('x', (bbox.x + (bbox.width / 2)).toString());
    // interceptionText.setAttribute('y', (svgHeight*0.8*-1).toString());
    // interceptionText.setAttribute('filter', 'url(#info_box)');
    // interceptionText.setAttribute('transform', "scale(1,-1)");
    // verticalInterceptionGroup.appendChild(interceptionText);

    interception.setAttribute('x1', (bbox.x + (bbox.width / 2)).toString());
    interception.setAttribute('x2', (bbox.x + (bbox.width / 2)).toString());
    interception.setAttribute('y1', (svgHeight*0.1).toString());
    interception.setAttribute('y2', (svgHeight*0.8).toString());
    interception.setAttribute('stroke', 'black');

    verticalInterceptionGroup.appendChild(interception);
    
  }

  function removeVerticalInterception(){
    if(verticalInterceptionGroup.firstChild){
      verticalInterceptionGroup.removeChild(verticalInterceptionGroup.lastChild);
      // verticalInterceptionGroup.removeChild(verticalInterceptionGroup.firstChild); 
    }
  }

  function cleanIdName(name: string){

    return name.replace(/\s/g, "");
  }

</script>

<ThemeContext bind:theme={theme}>
  <div bind:this="{rootNode}" class="wrapper" >
    <div bind:this="{headerChartParentTag}" class="title">
    </div>
    <div tabindex="0" class="description" aria-labelledby="{idChart}_desc_chart">
      {desc}
    </div>
    <div class="svg_wrap" bind:clientWidth="{svgWidth}" bind:clientHeight="{svgHeight}">
      <svg class="chart" role="graphics-document" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" bind:this={svgImage} width="{width}" height="{height}">
        <title id="{idChart}_title_chart">{title}</title>
        <desc id="{idChart}_desc_chart">{desc}</desc>
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
          <rect class="grid_surface" style="height:{svgHeight*0.7}" fill="url(#{idChart}_grid_pattern)" transform="scale(1, 1)"></rect>
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
          <g transform='translate(0,{svgHeight*0.8}) scale(0.2 , 0.2)'>
            <text class="y_label" x="50%" y="15%">{yLabel}</text>
          </g>
          <g transform='translate({svgWidth*0.7},{svgHeight*0.8}) scale(0.3 , 0.2)'>
            <text class="second_y_label" x="50%" y="15%">{secondYLabel}</text>
          </g>
        </g>
        <g class="axis" aria-hidden="true">
          <line class="" x1="10%"  x2="10%" y1="10%" y2="80%" stroke="black"/>
          <line class="" x1="10%"  x2="85%" y1="10%" y2="10%"  stroke="black"/>
          <line class="" x1="85%"  x2="85%" y1="10%" y2="80%" stroke="black"/>
        </g>
        <g class="grid_label" transform="translate(1, {svgHeight*0.1})" >
          {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
            <text text-anchor="middle" alignment-baseline="central"  x="5%" y="{(gridGap*i*-1)}">{gridGap*i}</text>
          {/each}
          {#each Array(Math.floor((svgWidth*0.8)/gridGap)) as _, i}
          {#if i%2 == 0}
          <text text-anchor="middle"  x="{(gridGap*i)+(svgWidth*0.1)}" y="7%">{gridGap*i}</text>
          {/if}
        {/each}
        </g>
        <g id="vertical_intercept" bind:this="{verticalInterceptionGroup}" transform='translate({svgWidth*0.1},0)'>
          
        </g>
        <g role="graphics-object" transform='translate({svgWidth*0.1},{svgHeight*0.1})' class="functions">
          {#each series as lines, l}
            <g id="{idChart}_{cleanIdName(lines.name)}" class="show_line">
              <polyline points="{getPoints(lines.points)}" fill="none" stroke='{colors ? colors[l]:'black'}'/>
              {#each lines.points as point, p}
                <circle 
                on:focus="{(event) => {showInfoBox(event); showVerticalInterception(event);}}"
                on:blur="{() => {blurInfoBox(); removeVerticalInterception()}}"
                tabindex="0"
                class="point"
                role="graphics-symbol" 
                aria-label="{point.ariaLabel}. This is point {p+1} of {lines.points.length}" 
                stroke="{colors ? colors[l]:'black'}" 
                fill="{colors ? colors[l]:'black'}"  
                cx="{point.x}" 
                cy="{point.y}" 
                r="3"/>

                <text class="info blur_info" filter="url(#info_box)" x="{point.x+20}" y="{point.y*-1}" stroke="{colors ? colors[l]:'black'}">{point.x},{point.y}</text>
                
                {#if p == (lines.points.length-1)}
                  <text font-size="smaller" transform="scale(1 -1)" stroke="{colors ? colors[l]:'black'}" x="{point.x+20}" y="{point.y*-1}">{lines.name}</text>
                {/if}
              {/each}
              
            </g>
          {/each}     
        </g>
        <g bind:this="{showedInfoBox}" role="graphics-object" transform='translate({svgWidth*0.1},{svgHeight*0.1}) scale(1, -1)' id="actually_focus"></g>
      </svg>
    </div>
    <div class="captions" style="padding: 0 {svgWidth*0.1}px;">
      {#each series as line, l}
        <button tabindex="0" id="{idChart}_{cleanIdName(line.name)}" aria-label="{line.name}" class="caption" on:click="{(event) => toogleCaption(event)}">
          <span class="dot" style="background-color: {colors ? colors[l]:'#ccc'};"></span>   
            {line.name}
        </button>
      {/each}
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

  .svg_wrap{
    display: inline-block;
  }

  circle:focus{
    outline: var(--circles-focus-color);
    outline-style: solid;
    outline-width: 2px;
    border-radius: var(--circles-focus-radius);
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
      height: 80%;
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
    font-size: 11px;
  }

  .y_label{
    transform:  scale(5, -5)  !important;
    transform-origin: center center;
    transform-box: fill-box;
    text-anchor: middle;
    font-size: 11px;
  }

  .second_y_label{
    transform:  scale(3, -5)  !important;
    transform-origin: center center;
    transform-box: fill-box;
    font-size: 11px;
    text-anchor: middle;
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

  .grid_label > text{
    transform: scale(1, -1);
    font-size: 9px;
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
</style>