<template>
  <div class="editor flex flex-col">

    <div class="editor-tabs w-full h-12 flex" v-if="editor">
      <div class="editor-tab px-4 py-3" v-for="(tab, i) in tabs"
        :active="i == activeTabIndex ? '' : null"
        @click="() => focusTab(i)"
      >
        {{ tab.name }}
        <button class="close w-4 h-4 ml-1 leading-tight rounded-sm text-red-500" @click="() => closeTab(i)">
          <XMarkIcon/>
        </button>
      </div>
    </div>

    <div ref="editorContainer" id="editor" class="h-full overflow-hidden">
      <LoadingArea v-if="loading" class="w-full h-full z-10"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import loader, { Monaco } from '@monaco-editor/loader';
import { editor, editor as Editor } from 'monaco-editor';
const { $eventBus, $BadgeAPI } = useNuxtApp();

const editorContainer: Ref<HTMLDivElement | null> = ref(null);
const loading = ref(true);
let monaco: Monaco;
let editor: Editor.IStandaloneCodeEditor;

type Tab = {
  name: string,
  model: editor.ITextModel,
  savedVersionId: number,
  hasUnsavedEdits: boolean,
}
const tabs: Tab[] = reactive([]);
const activeTabIndex: Ref<number | null> = ref(null);

onMounted(() => {
  loader.init().then(_monaco => {
    monaco = _monaco;
    editor = monaco.editor.create(editorContainer.value!, {
      automaticLayout: true,
      theme: 'vs-dark',
      model: null,
    });

    openFile('hello.txt', 'Hello world!\n');

    loading.value = false;
  })
});

$eventBus.on('file:open', async (path) => {
  let rawContent = await $BadgeAPI.fileSystem.readFile(path);
  let content = $BadgeAPI.textDecoder.decode(rawContent);

  openFile(path, content);
});

function openFile(path: string, content: string) {
  let name = path.split('/').pop()!;
  let ext = name.split('.').pop();

  let lang: string | undefined;
  if (ext && ext in extToLang) lang = extToLang[(ext as keyof typeof extToLang)];

  let model: Editor.ITextModel;
  model = monaco.editor.createModel(content, lang ?? ext);

  focusTab(tabs.push({
    name, model: markRaw(model),
    savedVersionId: model.getAlternativeVersionId(),
    get hasUnsavedEdits() { return model.getAlternativeVersionId() == this.savedVersionId },
  }) - 1);
}

function closeTab(index: number) {
  if (
    tabs[index].hasUnsavedEdits
    && !confirm('This file has unsaved changes, are you sure?')
  ) return;

  tabs[index].model.dispose();
  tabs.splice(index, 1);

  if (activeTabIndex.value == tabs.length) activeTabIndex.value--;
}

function focusTab(index: number) {
  editor.setModel(tabs[index].model);
  activeTabIndex.value = index;
}

const extToLang = {
  'md': 'markdown',
  'py': 'python',
  'c': 'cpp',
  'h': 'cpp',
};
</script>

<style lang="scss">
@import "~/assets/styles/config";
.editor-tabs {
  @apply select-none;

  background-color: $background-color-elevated;
  color: $text-color-elevated;

  .editor-tab {
    @apply cursor-pointer;
    @apply flex items-center;

    color: $text-color;

    &:hover {
      background-color: lighten($background-color-elevated, 2%);
    }

    &[active] {
      background-color: #1E1E1E;  // match editor background color
      color: $text-color-elevated;
    }

    .close:hover {
      background-color: lighten($surface-color, 2%);
    }
  }
}

.monaco-editor {
  @apply pt-4;
}
</style>
