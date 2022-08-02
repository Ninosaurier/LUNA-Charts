<script lang="ts">
    import { onMount } from 'svelte';
    import ThemeContext from '../theme/ThemeContext.svelte';
    import type {PieSeries} from './../models/PieChart';
    import {defaultTheme} from '../theme/defaultTheme';
    import { bind, current_component, each, prevent_default, text } from 'svelte/internal';
  
    export let title: string = '';
    export let desc: string = "";
    export let theme: any = defaultTheme;
    export let width: string = "800";
    export let height: string = "300";
    export let series: PieSeries[] = [];
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
    let cumulativePercents:number[]  = partialSum(series);
    let displayFront:SVGElement;

    function partialSum(series:PieSeries[]){
      
      let partialSliceSums:number[] = Array(series.length).fill(0);

      for(let i = 0; i<series.length; i++){

        if(i === 0){
          partialSliceSums[i] = series[i].percent;
        }
        else{

          partialSliceSums[i] = partialSliceSums[i-1] + series[i].percent;
        }
      }

      partialSliceSums.unshift(0);

      return partialSliceSums;
    }

    onMount(async () => {

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
  
    function generateId(){

      return Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9*Math.pow(10, 12)).toString(36);
    }
  
    function getXCoordinateForPercent(percent: number){
      
      //console.log("getXCoordinateForPercent: ", Math.cos(2 * Math.PI * percent));
      return  Math.cos(2 * Math.PI * percent);
    }
  
    function getYCoordinateForPercent(percent: number) {

      //console.log("getYCoordinateForPercent: ", Math.sin(2 * Math.PI * percent));
      return  Math.sin(2 * Math.PI * percent);
    }
  
    function calculateLargeArcFlag(percent: number){
    
        //console.log("calculateLargeArcFlag: ", percent > .5 ? 1 : 0);
        return percent > .5 ? 1 : 0;
    }
  
  
    function moveToFront(event: Event){

      let element: SVGAElement = (event.target as SVGAElement).cloneNode(true);
      console.log(element);
      
      element.onblur = removeAllChildNodes;
      displayFront.appendChild(element).focus();
      

    }

    function removeAllChildNodes() {
      
      while (displayFront.firstChild) {
        displayFront.removeChild(displayFront.firstChild);
        console.log('remove');
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
              <svg 
                class="chart" 
                role="graphics-document" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="-1.25 -1.25 2.5 2.5" 
                bind:this={svgImage} width="{width}" height="{height}"
              >
                <title id="{idChart}_title_chart">{title}</title>
                <desc id="{idChart}_desc_chart">{desc}</desc>
                <g>
                    {#each series as slice, index }


                      <path 
                        class="slice"
                        role="graphics-symbol"
                        aria-label="This slice of pie chart has {slice.percent}%. This is slice {index+1} of {series.length}" 
                        tabindex="0" 
                        on:focus="{event => moveToFront(event)}"
                        fill="{colors ? colors[index] : '#000'}"
                        d="{'M ' + getXCoordinateForPercent(cumulativePercents[index]) + " " 
                          + getYCoordinateForPercent(cumulativePercents[index])
                          + " A 1 1 0 " + calculateLargeArcFlag(slice.percent) + " 1 " 
                          + getXCoordinateForPercent(cumulativePercents[index] + slice.percent) + " " 
                          + getYCoordinateForPercent(cumulativePercents[index] + slice.percent) + "L 0 0 L"
                          + getXCoordinateForPercent(cumulativePercents[index]) + " " 
                          + getYCoordinateForPercent(cumulativePercents[index])}"
                      >
                      </path>
                      <!-- svelte-ignore component-name-lowercase -->
                      <text id="{idChart}_{slice.name}_slice" class="pie_chart_text"
                        text-anchor="{
                          cumulativePercents[index+1] >= 0.5 
                          && cumulativePercents[index+1] <= 0.75 ? 'end':'start'
                          }"
                        x="{getXCoordinateForPercent((cumulativePercents[index+1] - (slice.percent/2)))*1.1}" 
                        y="{getYCoordinateForPercent((cumulativePercents[index+1] - (slice.percent/2)))*1.1}">
                        {slice.name}
                      </text>
                    {/each}                    
                </g>
                <g class="display_front" bind:this="{displayFront}">

                </g>
              </svg>
            </div>  
          </div>
      </ThemeContext>
<style>
  .pie_chart_text{
    font-size: 0.12px;
  }

  .slice:focus{
  stroke: #646464;
  outline: none;
  stroke-width: 0.05px;
  stroke-linecap: square;
  }
</style>