<template>
  <nav class="navbar">
    <NuxtLink class="navbar-brand" to="/">
      <img src="/images/MCH.png"/>
    </NuxtLink>

    <div class="navbar-nav">
      <div>
        <NuxtLink class="nav-link" v-for="item in navItems[0]" :to="item.to">{{ item.text }}</NuxtLink>
      </div>
      <div>
        <NuxtLink class="nav-link" v-for="item in navItems[1]" :to="item.to" target="_blank">{{ item.text }}</NuxtLink>
      </div>
    </div>
  </nav>
</template>

<style lang="scss">
@import "~/assets/styles/config";

.navbar {
  height: $navbar-height;

  background-color: $brand-purple;
  font-weight: 600;
  color: $brand-yellow;

  display: flex;
  flex-wrap: nowrap;
  align-items: center;

  .navbar-brand {
    height: 100%;
    width: $sidebar-width;
    background-color: $brand-yellow;

    img {
      height: 100%;
      margin: 0 auto;
      padding: 0.3rem;
    }
  }

  .navbar-nav {
    flex: 1;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;

    padding: 0 0.5em;
    height: 100%;

    .nav-link {
      $base-margin: 0.4em;  // space between and around nav buttons
      $base-padding: calc($navbar-height/2 - $base-margin - 1.5em/2);

      margin: $base-margin calc($base-margin / 2);
      padding: $base-padding calc($base-padding + $base-margin);

      border-radius: 0.3em;

      &:hover {
        background-color: darken($brand-primary, 7%);
      }
    }
  }
}
</style>

<script lang="ts" setup>
const navItems = [
  [
    { text: 'Home', to: '/' },
    { text: 'Hatchery', to: 'https://mch2022.badge.team' },
  ],
  [
    { text: 'Source', to: pkgInfo.repoUrl },
  ]
]
</script>
