<template>
  <div class="loading-area flex flex-col justify-center">
    <div class="place-self-center items-center justify-items-center">
      <Loading :size="12"/>
    </div>
  </div>
</template>

<style lang="scss">
@import '~/assets/styles/config';

.loading-area {
  background-color: $body-background-color;
  color: $body-text-color;
}
</style>
