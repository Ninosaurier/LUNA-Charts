<script lang="ts">
    import { setContext, onMount, getContext, getAllContexts } from "svelte";
    import { writable, get } from "svelte/store";
    import type {LineTheme, PieTheme, BarTheme} from "../types/theme/Theme.type";

    // expose props for customization and set default values
    export let theme: LineTheme | PieTheme | BarTheme;

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
    const setRootColors = (theme:LineTheme | PieTheme | BarTheme) => {
      for (let [attr, obj] of Object.entries(theme)) {
        //   console.log(attr + ', ' + obj);

        if(attr === 'name'){
            continue;
        }
        else{

            if(attr === "focusBorder"){
              
              console.log(`--${attr}`, `${obj}`)
              document.documentElement.style.setProperty(`--${attr}`, `${obj}`);
              continue;
            }
            for(let [prop, value] of Object.entries(obj)){

                let varString;
                console.log('attr: ', attr)

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
    <!-- content will go here -->
  </slot>

<style>
  :global(text){
      font-family: 'Fira Sans', 'Helvetica Neue', 'Helvetica', sans-serif !important;
  }
</style>  