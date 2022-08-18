<script lang="ts">
import type {HatchPattern} from '../types/theme/Hatch.type';
export let idPattern:string = '';
export let pattern:string = '';
export let color:string = ''

const square: string = "M 5 0 L 5 5 L 0 5 L 0 0 Z"; 
const circles: string = "M 6 6 m -5 0 a 1 1 90 1 0 5 0 a 1 1 90 1 0 -5 0"; 
const hLine: string = "M0,0 L8,0";
const diagonal: string = "M0,0 l8,10"; 

const HATCHES: HatchPattern[] = [{
    name: 'circles',
    pattern: circles,
  },
  {
    name: 'square',
    pattern: square,
  },
  {
    name: 'hLine',
    pattern: hLine,
  },
  {
    name: 'diagonal',
    pattern: diagonal,
  }, 
];

function getPatternByName(name: string) {

    return HATCHES.find(element => name === element.name)?.pattern;
}

</script>

<pattern id="{idPattern}" patternUnits="userSpaceOnUse" width="8" height="10">

    <path 
        d="{getPatternByName(pattern)}"
        class="{pattern}" 
        fill="none" 
        stroke="{color !== ''? color:'black'}" 
        stroke-width="{pattern === 'hLine' ? 12:2}">
    </path>
</pattern>

<style>

</style>