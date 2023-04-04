# MCH2022 badge WebUSB companion

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:
```bash
# yarn
yarn install
```

## Development

Start the development server on http://localhost:3000
```bash
yarn dev
```

### Access BadgeUSB API

The BadgeAPI is available through the plugin set up in `plugins/badgeUSB.client.ts`.
You can use it in a page or component like this:
```Vue
<template>
  ...
</template>

<script lang="ts" setup>
const { $BadgeAPI } = useNuxtApp();

/* do stuff */
</script>
```

## Production

Build the application for production:
```bash
yarn build
```

Locally preview production build:
```bash
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
