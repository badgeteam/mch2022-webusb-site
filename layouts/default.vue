

<template>
  <Body>
    <NavBar/>
    <div class="page">
      <slot/>
    </div>
  </Body>
</template>

<style lang="scss">
@import '~/assets/styles/main';

.page {
  min-height: calc(100vh - $navbar-height);
}
</style>
