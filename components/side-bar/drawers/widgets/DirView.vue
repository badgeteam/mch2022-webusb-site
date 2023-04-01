<template>
  <details class="dir-view" @toggle="onToggle">

    <summary :class="{ 'error': loadError }" tabindex="0">
      <span class="name">{{ props.displayName ?? props.dirNode.name }}</span>

      <Loading v-if="loading" :size="4" class="mr-1.5"/>
      <button v-if="loadError" class="w-4 h-4 mr-2 text-red-500 retry" @click="() => requestUpdate()">
        <ArrowPathRoundedSquareIcon/>
      </button>
    </summary>

    <DirView v-for="dir in dirs" :dirNode="dir"
      @loadDirRequest="(dir, cb) => emit('loadDirRequest', dir, cb)"
    />

    <li v-for="file in files" tabindex="0" @dblclick="() => $eventBus.emit('file:open', file.path)">
      <span class="name">{{ file.name }}</span></li>
  </details>
</template>

<script lang="ts" setup>
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/outline';
import { DirNode, FileNode } from '../Files.vue';

const { $connected, $eventBus } = useNuxtApp();

const props = defineProps({
  displayName: String,
  dirNode: {
    type: Object as PropType<DirNode>,
    required: true,
  },
  dummy: {
    type: Boolean,
    default: false,
  }
});

let loading = ref(false);
let loadError = ref(false);

const emit = defineEmits<{
  (e: 'loadDirRequest', dir: DirNode, callback: (error?: any) => void): void
}>();

const dirs = computed(() => props.dirNode.children.filter(n => n.type == 'dir') as DirNode[]);
const files = computed(() => props.dirNode.children.filter(n => n.type == 'file') as FileNode[]);

function onToggle($event: any) {
  const opened: boolean = $event.target.open;

  if (opened) requestUpdate();
}

function requestUpdate() {
  if ($connected && !loading.value && !props.dummy) {
    loading.value = true;

    emit('loadDirRequest', props.dirNode, (err) => {
      loading.value = false;
      loadError.value = !!err;
    });
  }
}
</script>

<style lang="scss">
@import '~/assets/styles/config';

@function encodecolor($string) {
  @if type-of($string) == 'color' and str-index(#{$string}, '#') == 1 {
    $hex: str-slice(ie-hex-str($string), 4);
    $string: unquote('#{$hex}');

    @return '%23' + $string;
  }

  @return $string;
}

.dir-view {
  summary, li {
    @apply flex flex-nowrap items-center;
    @apply list-none whitespace-nowrap overflow-ellipsis select-none;
    @apply cursor-pointer;

    > .name {
      @apply mr-auto;
    }

    &:hover {
      background-color: darken($sidebar-surface-color, 1%)
    }

    &:focus-visible {
      background-color: mix($sidebar-drawer-surface-color, $brand-primary, 50%);
      outline: 1px solid lighten($brand-primary, 10%);
    }

    // &.error {
    //   &::after {
    //     @apply mr-3 bg-red-500;
    //     $size: 0.5em;

    //     content: '';
    //     width: $size;
    //     height: $size;
    //     border-radius: calc($size / 2);
    //   }
    // }
  }

  summary {
    // custom marker
    &::before {
      @apply mr-2 inline-block align-middle;
      content: '';

      width: 1em;
      height: 1em;
      padding-top: 0.2em;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='#{encodecolor($sidebar-drawer-text-color)}' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' /%3E%3C/svg%3E") no-repeat;

      transition: 50ms ease-in rotate;
    }
  }

  &[open] > summary::before {
    rotate: 90deg;
  }

  // indent dir contents
  > :not(summary) {
    @apply pl-4;
  }

  li {
    @apply ml-5;
  }
}
</style>
