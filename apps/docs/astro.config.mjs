import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';
import starlightThemeFlexoki from 'starlight-theme-flexoki';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

export default defineConfig({
  site: 'https://tadpolehq.com',
  integrations: [
    starlight({
      title: 'Tadpole Docs',
      logo: {
        src: './src/assets/logo.png',
      },
      social: [
        {
          icon: 'github',
          label: 'Github',
          href: 'https://github.com/tadpolehq',
        },
      ],
      sidebar: [
        {
          label: 'Welcome',
          link: '/',
        },
        { label: 'Getting Started', link: '/getting-started' },
        {
          label: 'Language Overview',
          link: '/language-overview',
        },
        {
          label: 'Built-in Reference',
          items: [
            { label: 'Browser Actions', link: '/builtins/browser-actions' },
            { label: 'Session Actions', link: '/builtins/session-actions' },
            {
              label: 'Expression Functions',
              link: '/builtins/expression-functions',
            },
            { label: 'Evaluators', link: '/builtins/evaluators' },
          ],
        },
        {
          label: 'Guides',
          items: [
            {
              label: 'Creating Reusable Modules',
              link: '/guides/creating-reusable-modules',
            },
            {
              label: 'Creating a Paginator',
              link: '/guides/creating-a-paginator',
            },
            {
              label: 'Configure Stealth Profiles',
              link: '/guides/configure-stealth-profiles',
            },
          ],
        },
        {
          label: 'Community Modules',
          link: 'https://github.com/tadpolehq/community',
          attrs: { target: '_blank' },
        },
        {
          label: 'License',
          link: 'https://github.com/tadpolehq/tadpole/blob/main/LICENSE',
          attrs: { target: '_blank' },
        },
        typeDocSidebarGroup,
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: ['../../packages/core', '../../packages/schema'],
          typeDoc: {
            entryPointStrategy: 'packages',
            packageOptions: {
              entryPoints: ['src/index.ts'],
            },
          },
          sidebar: {
            label: 'API Reference',
            collapsed: true,
          },
        }),
        starlightThemeFlexoki(),
      ],
    }),
    mdx(),
  ],
});
