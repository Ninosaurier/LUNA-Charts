

<script lang="ts">

    import { onMount } from 'svelte';
    import ThemeContext from '../theme/ThemeContext.svelte';
    import {defaultTheme} from '../theme/defaultTheme';

    export let title: string = '';
    export let desc: string = "";
    export let theme: any = defaultTheme;
    export let width: string = "800";
    export let height: string = "300";
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
    var barGap: number = 6;
    var barGroupSize: number = calculateBarGroupSize();
    var chartWidth: number = parseInt(width)*0.75;;




    onMount(async () => {

        idChart = generateId();
        createHeaderTag(findParentHeader());
        colors = Object.values(theme[0].color);
        console.log('bar-colors: ', colors);
        var bar = series.series
        console.log('series: ', bar[0].name );
    });

    function cleanIdName(name: string){

      return name.replace(/\s/g, "");
    }

    function generateId(){

        return Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9*Math.pow(10, 12)).toString(36);
    }

    function createHeaderTag(headerNumber: number){

        var newHeader: HTMLElement;

        if(headerNumber > 5){
          console.warn('Headline cannot be created. HTML allows only h1 - h6. The chart would get h'+ (++headerNumber));
        }
        else{

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
        var resultHeader: number  = null;

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

    function calculateBarGroupSize(): number{

      return (parseInt(width)*0.75/series.category.length) - barGap*2;
    }

    function calculateBarSize(): number{

      return barGroupSize/series.series.length;
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

</script>

<ThemeContext>
    <div bind:this="{rootNode}" class="wrapper">
        <div bind:this="{headerChartParentTag}" class="title">
        </div>
        <div tabindex="0" class="description" aria-labelledby="{idChart}_desc_chart">
            {desc}
        </div>
        <div class="svg_wrap" bind:clientWidth="{svgWidth}" bind:clientHeight="{svgHeight}">
          <svg class="chart" role="graphics-document" xmlns="http://www.w3.org/2000/svg" bind:this={svgImage} width="{width}" height="{height}">
            <title id="{idChart}_title_chart">{title}</title>
            <desc id="{idChart}_desc_chart">{desc}</desc>
            <defs>
              <pattern id="{idChart}_grid_pattern"  width="{gridGap}" height="{gridGap}" patternUnits="userSpaceOnUse">
                  <path class="grid_path" d="M 0 {gridGap} H 0 {gridGap}" fill="none" stroke-width="0.5"/>
              </pattern>
              <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                <path d="M-1,1 l2,-2
                         M0,4 l4,-4
                         M3,5 l2,-2" 
                      style="stroke:black; stroke-width:1" />
              </pattern>
            </defs>
            <g role="none" aria-hidden="true">
              <rect width="90%" class="background-chart"></rect> 
            </g>
            <g class="grid" transform='translate({svgWidth*0.1},{svgHeight*0.1})'>
              <rect class="grid_surface" style="height:{svgHeight*0.7}" fill="url(#{idChart}_grid_pattern)" transform="scale(1, 1)"></rect>
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
                <text text-anchor="middle" alignment-baseline="central"  x="5%" y="{(gridGap*i*-1)}">{gridGap*i}</text>
              {/each}
            </g>
            <g class="x_grid_label" transform="translate({svgWidth*0.1}, 0)">     
                {#each series.category as category, i}
                  <g transform="translate({((barGroupSize+barGap*2)*i)+barGap}, {svgHeight*0.15})">
                    <text text-anchor="end"  class="x_grid_text_label">
                      {category}
                    </text>
                  </g>
                {/each}
            </g>
            <g role="graphics-object" transform='translate({svgWidth*0.1},{svgHeight*0.1})' class="functions">
              {#each series.category as category, c}
                <g transform='translate({barGap*2*c},0)'>
                  {#each series.series as bar, b}
                    <rect class="{bar.name}_bar show_bar" fill="{colors ? colors[b]:'#ccc'}" tabindex="0" x="{(c*barGroupSize)+(calculateBarSize()*b)}" width="{calculateBarSize()}" height="{bar.data[c].value}"></rect>
                    <!-- <rect class="{bar.name}_bar show_bar" fill="url(#diagonalHatch)" tabindex="0" x="{(c*barGroupSize)+(calculateBarSize()*b)}" width="{calculateBarSize()}" height="{bar.data[c].value}"></rect> -->
                    {/each}
                </g>
              {/each}
            </g>
          </svg>
        </div>
        <div class="captions" style="padding: 0 {svgWidth*0.1}px;">
          {#each series.series as barSeries, l}
            <button tabindex="0" value="{barSeries.name}" id="{idChart}_{cleanIdName(barSeries.name)}" aria-label="{barSeries.name}" class="caption" on:click="{(event) => toggleBars(event)}">
              <span class="dot" style="background-color: {colors ? colors[l]:'#ccc'};"></span>   
                {barSeries.name}
            </button>
          {/each}
        </div>
        <div class="source">
          <a tabindex="0" href="{source}">Source: {source}</a>
        </div>
    </div>
</ThemeContext>
    

<style>

  .x_grid_text_label{
    transform: scale(1, -1) rotate(-45deg);
    transform-origin: center center;
    font-size: 9px;
  }

  .wrapper{
    background-color: #f7f7f7;
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

  .y_grid_label > text{
    transform: scale(1, -1);
    font-size: 9px;
  }



  :global(.hide_bar){
    display: none !important;
  }

  :global(.show_bar){
    display: block !important;
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
</style>