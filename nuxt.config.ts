import childProcess from "child_process";
import packageMeta from "./package.json";

const commitHash = childProcess.execSync('git rev-parse --short HEAD', { encoding: 'ascii' });
const _pkgInfo = {
  ref: commitHash,
  repoUrl: packageMeta.repository,
  version: packageMeta.version,
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Badge.team IDE',
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  vite: {
    define: {
      'pkgInfo': _pkgInfo,
    }
  },
});

declare global {
  const pkgInfo: typeof _pkgInfo;
}
