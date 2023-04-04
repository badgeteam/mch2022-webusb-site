<template>
  <div class="context-menu" :style="position" tabindex="1"
    v-autofocus @focusout="() => emit('done')"
  >
    <div class="group" v-for="group in items">
      <li v-for="item in group" @click="() => handleClick(item.callback)"
      ><span>{{ item.text }}</span></li>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  items: {
    type: Object as PropType<{ text: string, callback: () => void }[][]>,
    required: true,
  },
  origin: {
    type: Object as PropType<{ x: number, y: number }>,
    required: true,
  },
});


const position = reactive({
  left: `${props.origin.x}px`,
  top: `${props.origin.y}px`,
});

const emit = defineEmits<{
  (e: 'done'): void
}>();

function handleClick(callback: () => void) {
  emit('done');
  callback();
}
</script>

<style lang="scss">
@import '~/assets/styles/config';

.context-menu {
  @apply absolute flex flex-col whitespace-nowrap;
  @apply border rounded-md;
  padding: 0 !important;
  color: $text-color-elevated;
  border-color: lighten($background-color-elevated, 15%);
  background-color: $background-color-elevated;

  .group {
    @apply p-1.5;
    @apply list-none select-none cursor-pointer border-inherit;

    li {
      @apply px-4 py-1 rounded-sm text-sm;

      &:hover {
        background-color: $brand-primary;
        color: lighten($text-color-elevated, 15%);
      }
    }

    &:not(:first-child) {
      @apply border-t;
    }
  }
}
</style>
