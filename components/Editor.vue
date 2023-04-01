<template>
  <div class="editor flex flex-col">
    <div class="editor-tabs w-full h-12 flex" v-if="editor">
      <div class="editor-tab px-4 py-3" :active="tabName == activeTab"
        v-for="(tabName, i) in tabs" @click="() => focusTab(i)">
        {{ tabName }}
        <!-- <button class="w-4 h-4 mr-2 text-red-500 retry" @click="() => requestUpdate()">
          <ArrowPathRoundedSquareIcon/>
        </button> -->
      </div>
    </div>

    <div ref="editorContainer" id="editor" class="h-full overflow-hidden">
      <LoadingArea v-if="loading" class="w-full h-full z-10"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import loader, { Monaco } from '@monaco-editor/loader';
import { editor, editor as Editor } from 'monaco-editor';
const { $eventBus, $BadgeAPI } = useNuxtApp();

const editorContainer: Ref<HTMLDivElement | null> = ref(null);
const loading = ref(true);
let monaco: Monaco;
let editor: Editor.IStandaloneCodeEditor;

const tabs: string[] = reactive([]);
const models: editor.ITextModel[] = [];
const activeTab: Ref<string | null> = ref(null);

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
  // editor.getModel()?.setValue(content);
  let name = path.split('/').pop()!;
  let ext = name.split('.').pop();

  let lang: string | undefined;
  if (ext && ext in extToLang) lang = extToLang[(ext as keyof typeof extToLang)];

  let model: Editor.ITextModel;
  model = monaco.editor.createModel(content, lang ?? ext);

  tabs.push(name);
  models.push(model);
  editor.setModel(model);
  activeTab.value = name;
}

function focusTab(index: number) {
  editor.setModel(models[index]);
  activeTab.value = tabs[index];
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

  background-color: $sidebar-drawer-surface-color;
  color: $sidebar-drawer-text-color;

  .editor-tab {
    @apply cursor-pointer;

    background-color: $sidebar-surface-color;
    color: $sidebar-text-color;

    &[active] {
      background-color: $body-background-color;
      color: $body-text-color;
    }
  }
}

.monaco-editor {
  @apply pt-4;
}
</style>
