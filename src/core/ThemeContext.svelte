<script lang="ts">
    import { onMount } from "svelte";
    import type {LineTheme, PieTheme, BarTheme} from "../types/theme/Theme.type";

    export let theme: LineTheme | PieTheme | BarTheme;
  
    onMount(() => {

      setRootColors(theme);
    });
  
    const setRootColors = (theme:LineTheme | PieTheme | BarTheme) => {
      for (let [attr, obj] of Object.entries(theme)) {

        if(attr === 'name'){
            continue;
        }
        else{

            if(attr === "focusColor"){
              
              document.documentElement.style.setProperty(`--${attr}`, `${obj}`);
              continue;
            }
            for(let [prop, value] of Object.entries(obj)){

                let varString;

                if(attr !== 'colors'){
                  varString = `--${attr}-${prop}`;
                  document.documentElement.style.setProperty(varString, value);
                }
            }
        }
      }
      document.documentElement.style.setProperty("--theme-name", theme.name);
    };

</script>
  
<slot>
    
</slot>

<style>
  :global(text){
      font-family: 'Fira Sans', 'Helvetica Neue', 'Helvetica', sans-serif !important;
  }

  :global(.no_series_label){
    transform: scale(1,-1);
    background-color: var(--wrapperStyles-backgroundColor);
  }
</style>  