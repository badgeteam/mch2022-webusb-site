<template>
  <ClientOnly>
    <SideBar/>

    <Editor ref="editor"/>

    <template #fallback>
      <LoadingArea class="w-full"/>
    </template>

  </ClientOnly>
</template>

<script lang="ts" setup>
import Editor from '~/components/Editor.vue';

const editor = ref<InstanceType<typeof Editor> | null>(null);

</script>

<style lang="scss">
@import '~/assets/styles/config';

.page {
  display: flex;
  justify-content: stretch;
}
.sidebar, .editor {
  height: calc(100vh - $navbar-height);
}
.sidebar {
  flex: none;
}
.editor {
  background-color: lighten($background-color, 5%);
  @apply w-full overflow-hidden; // fill available space
}
</style>
