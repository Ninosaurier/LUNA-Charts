// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';


// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'LUNA-Charts',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://git.byting-pandas.ninja/Ninosaurier/LUNA-Charts',
        },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [{ autogenerate: { "directory": "getting-started" } }],
        },
        {
          label: 'Architecture',
          items: [
            {
              label: 'ADM',
              items: [{ autogenerate: { "directory": "architecture/adm" } }],
            },
            {
              label: 'ADRs',
              items: [{ autogenerate: { "directory": "architecture/adr" } }],
            },
          ],
        },
      ],
    }),
  ],
});
