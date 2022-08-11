<script lang="ts">
    import { setContext, onMount, getContext, getAllContexts } from "svelte";
    import { writable, get } from "svelte/store";
    import { testTheme as presets } from "./defaultTheme";
    import type {LineTheme, PieTheme} from "../types/theme/Theme.type";
import LineChart from "../components/LineChart.svelte";
import PieChart from "../components/PieChart.svelte";
    // expose props for customization and set default values
    export let theme: LineTheme | PieTheme = presets;

    // set state of current theme's name
    //let _current = presets[0].name;
  
    // utility to get current theme from name
    //const getCurrentTheme = name => theme.find(h => h.name === name);
    // set up Theme store, holding current theme object
    //export const Theme = writable(getCurrentTheme(_current));
  
    // setContext("theme", {
    //   // providing Theme store through context makes store readonly
    //   theme: Theme,
    //   toggle: () => {
    //     // update internal state
    //     let _currentIndex = theme.findIndex(h => h.name === _current);
    //     _current =
    //       theme[_currentIndex === themes.length - 1 ? 0 : (_currentIndex += 1)]
    //         .name;
    //     // update Theme store
    //     Theme.update(t => ({ ...t, ...getCurrentTheme(_current) }));
    //     setRootColors(getCurrentTheme(_current));
    //   }
    // });
  
    onMount(() => {

      console.log('Set ' + theme.name + ' theme');
      
      // set CSS vars on mount
      setRootColors(theme);
    });
  
    // sets CSS vars for easy use in components
    // ex: var(--theme-background)
    const setRootColors = theme => {
      for (let [attr, obj] of Object.entries(theme)) {
        //   console.log(attr + ', ' + obj);

        if(attr === 'name'){
            continue;
        }
        else{
            for(let [prop, value] of Object.entries(obj)){

                let varString;

                if(attr !== 'colors'){
                  varString = `--${attr}-${prop}`;
                  //console.log(varString)
                  document.documentElement.style.setProperty(varString, value);
                }
            }
        }
      }
      document.documentElement.style.setProperty("--theme-name", theme.name);
    };

  </script>
  
  <slot>
    <!-- content will go here -->
  </slot>