<template>
  <details class="dir-view" @toggle="onToggle" :open="open || root">

    <summary :class="{ 'error': loadError }" tabindex="0"
      @contextmenu.prevent="$event => openContextMenu($event, props.dirNode)"
      @keydown.delete.stop="() => deleteNode(props.dirNode)"
    >
      <span class="name">{{ props.displayName ?? props.dirNode.name }}</span>

      <Loading v-if="loading" :size="4" class="mr-1.5"/>
      <button v-if="loadError" @click="() => requestUpdate()"
        class="w-4 h-4 mr-2 text-red-500 retry"
      >
        <ArrowPathRoundedSquareIcon/>
      </button>
    </summary>

    <DirView v-for="dir in dirs" :dirNode="dir" :open="root"
      @loadDirRequest="(dir, cb) => emit('loadDirRequest', dir, cb)"
    />

    <li v-for="file in files" tabindex="0" :ref="el => { fileRefs.set(file.path, el as HTMLLIElement) }"
      @contextmenu.prevent="$event => openContextMenu($event, file)"
      @dblclick="() => $eventBus.emit('file:open', file)"
      @keydown.delete.stop="() => deleteNode(file)"
    >
      <span class="name">{{ file.name }}</span>
    </li>
  </details>

  <ContextMenu
    v-if="contextMenu"
    :items="contextMenu.items"
    :origin="contextMenu.origin"
    @done="() => contextMenu = null"
  />
</template>

<script lang="ts" setup>
import type { DirNode, FSNode, FileNode } from '~/plugins/badge-usb.client.js';
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/outline';

const { $connected, $eventBus } = useNuxtApp();

const props = defineProps({
  displayName: String,
  dirNode: {
    type: Object as PropType<DirNode>,
    required: true,
  },
  root: Boolean,
  open: Boolean,
});

let loading = ref(false);
let loadError = ref(false);

const emit = defineEmits<{
  (e: 'loadDirRequest', dir: DirNode, callback: (error?: any) => void): void
}>();

const dirs = computed(() => props.dirNode.children.filter(n => n.type == 'dir') as DirNode[]);
const files = computed(() => props.dirNode.children.filter(n => n.type == 'file') as FileNode[]);

const fileRefs = ref(new Map<string, HTMLLIElement>);
onBeforeUpdate(() => fileRefs.value.clear());

function onToggle($event: any) {
  const opened: boolean = $event.target.open;
  if (opened) requestUpdate();
}

function requestUpdate() {
  if ($connected && !loading.value && !props.root) {
    loading.value = true;

    emit('loadDirRequest', props.dirNode, (err) => {
      loading.value = false;
      loadError.value = !!err;
      if (!!err) console.error('Error while updating dir', props.dirNode.path, err);
    });
  }
}

$eventBus.on('file:created', fsNode => {
  if (fsNode.parent?.path == props.dirNode.path)
    fileRefs.value.get(fsNode.path)?.focus();
});

function deleteNode(node: FSNode) {
  const nodeType = node.type == 'dir' ? 'folder' : 'file';
  if (!confirm(`Are you sure you want to delete ${nodeType} '${node.name}'?`)) return;
  $eventBus.emit('file:delete', node);
}

let contextMenu: Ref<{
  items: { text: string, callback: () => void }[][],
  origin: {x: number, y: number}
} | null> = ref(null);

function openContextMenu(event: PointerEvent | MouseEvent, node: DirNode | FileNode) {
  contextMenu.value = {
    items: [[
      {
        text: 'Delete',
        callback() {
          if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;
          $eventBus.emit('file:delete', node);
        },
      },
    ]],
    origin: {
      x: event.x,
      y: event.y,
    }
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
  .dir-view, > li {
    @apply border-l;
    border-color: $background-color-elevated;
    transition: 100ms ease-in border-color;
  }
  &:hover {
    .dir-view, .dir-view > li {
      border-color: lighten($background-color-elevated, 10%);
    }
  }

  summary, > li {
    @apply flex flex-nowrap items-center;
    @apply list-none whitespace-nowrap;
    @apply select-none cursor-pointer;

    > .name {
      @apply mr-auto min-w-0 overflow-ellipsis overflow-hidden;
    }

    &:hover {
      background-color: lighten($background-color-elevated, 4%);
    }

    &:focus {
      background-color: $accent-background-color;
      outline: 1px solid lighten($brand-primary, 10%);
    }
  }

  summary {
    // custom marker
    &::before {
      @apply w-4 h-4 mr-1 mt-0.5 flex-none;

      content: '';
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='#{encodecolor($text-color-elevated)}' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' /%3E%3C/svg%3E") no-repeat;
      transition: 50ms ease-in rotate;
    }

    &:focus {
      ~ .dir-view, ~ li {
        border-color: lighten($background-color-elevated, 25%);
      }
    }
  }
  &[open] > summary::before {
    rotate: 90deg;
  }

  // indent dir contents
  > :not(summary) {
    @apply ml-1.5 pl-2.5;
  }
  > li {
    @apply pl-4;
  }
}
</style>
