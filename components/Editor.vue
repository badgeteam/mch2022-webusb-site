<template>
  <div class="editor flex flex-col">

    <div class="editor-tabs w-full h-12 flex items-center" v-if="editor">
      <div v-for="(tab, i) in tabs" class="editor-tab px-4 py-3"
        :class="{ 'italic': tab.hasUnsavedEdits, 'line-through': tab.file?.deleted }"
        :active="i == activeTabIndex ? '' : null"
        @click="() => focusTab(i)"
        @auxclick="$event => { if ($event.button == 1) /* middle click */ closeTab(i) }"
      >
        {{ tab.name }}
        <button class="close w-4 h-4 ml-1 leading-tight rounded-sm text-red-500" @click.stop="() => closeTab(i)">
          <XMarkIcon/>
        </button>
      </div>

      <button class="h-10 w-10 p-2.5" @click="() => openFile('newFile.txt', '')">
        <PlusIcon/>
      </button>
    </div>

    <div ref="editorContainer" id="editor" class="h-full overflow-hidden">
      <LoadingArea v-if="loading" class="w-full h-full z-10"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import { FileNode } from '~/plugins/badge-usb.client.js';
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import loader, { Monaco } from '@monaco-editor/loader';
import { editor, editor as Editor } from 'monaco-editor';
const { $BadgeAPI, $connected, $eventBus, $files } = useNuxtApp();

const editorContainer: Ref<HTMLDivElement | null> = ref(null);
const loading = ref(true);
let monaco: Monaco;
let editor: Editor.IStandaloneCodeEditor;

type Tab = {
  name: string,
  file?: FileNode,
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

    // keyboard shortcuts
    editor.onKeyDown($event => {
      if ($event.ctrlKey) {
        switch ($event.browserEvent.key) {
          case 's': // Ctrl+S
            saveCurrentTab();
            $event.preventDefault();
            break;
        }
      }
    });

    openFile('hello.md', helloWorldText);
    loading.value = false;
  })
});

$eventBus.on('file:open', openFile);
$eventBus.on('file:deleted', deletedFile => {
  let tab = tabs.find(t => t.file?.path == deletedFile.path);
  if (tab?.file) tab.file.deleted = true;
});

async function openFile(file: FileNode): Promise<void>
async function openFile(file: string, content?: string): Promise<void>
async function openFile(file: string | FileNode, content?: string) {
  const isFileNode = typeof file == 'object';

  const path = isFileNode ? file.path : file;
  let name = path.split('/').pop()!;
  let ext = name.split('.').pop();

  let tabIndex = tabs.findIndex(t => t.file?.path == path);
  if (tabIndex > -1) {
    focusTab(tabIndex);
    return;
  }

  content ??= await readFileText(isFileNode ? file.path: file);

  let lang: string | undefined;
  let model: Editor.ITextModel;
  if (ext && ext in extToLang) {
    lang = extToLang[(ext as keyof typeof extToLang)];
  }
  model = monaco.editor.createModel(content, lang ?? ext);

  focusTab(tabs.push({
    name,
    file: isFileNode ? file : undefined,
    model: markRaw(model),
    savedVersionId: model.getAlternativeVersionId(),
    get hasUnsavedEdits() {
      return !this.file || this.file.deleted ||
        model.getAlternativeVersionId() != this.savedVersionId
    },
  }) - 1);
}

function closeTab(index: number) {
  if (
    tabs[index].hasUnsavedEdits && !tabs[index].file?.deleted &&
    !confirm('This file has unsaved changes, are you sure?')
  ) return;

  tabs[index].model.dispose();
  tabs.splice(index, 1);

  if (activeTabIndex.value == tabs.length) focusTab(tabs.length - 1);
}

function focusTab(index: number) {
  editor.setModel(tabs[index].model);
  activeTabIndex.value = index;
}

async function saveCurrentTab() {
  if (!$connected.value) {
    alert('Not connected to a badge, can\'t save!');
    return;
  }
  const tab = tabs[activeTabIndex.value!];
  const version = tab.model.getAlternativeVersionId();
  const rawContent = $BadgeAPI.textEncoder.encode(tab.model.getValue());

  let newFile = !tab.file || tab.file.deleted;
  let path: string;
  if (tab.file && !tab.file.deleted) {
    path = tab.file.path;
  } else {
    path = prompt(
      'Where do you want to save this file?',
      tab.file?.path ?? '/internal/myFile.txt',
    ) ?? '';
    if (path == '') return;
    if (
      await $BadgeAPI.fileSystem.exists(path) &&
      !confirm(`The file ${path} already exists, do you want to overwrite it?`)
    ) return;
  }

  console.debug('writing file', path, rawContent);
  await $BadgeAPI.fileSystem.writeFile(path, rawContent.buffer);
  tab.savedVersionId = version;

  if (newFile) {
    const file = await $files.getNode(path);
    if (!file || file.type == 'dir') {
      console.debug('File path:', path);
      console.debug('Directory:', $files.directory);
      throw new Error('No node for created file');
    }
    tab.file = file;
    tab.file.deleted = false;
    tab.name = file.name;
    $eventBus.emit('file:created', file);
  }
}

async function readFileText(path: string): Promise<string> {
  let rawContent = await $BadgeAPI.fileSystem.readFile(path);
  return $BadgeAPI.textDecoder.decode(rawContent);
}

const extToLang = {
  'md': 'markdown',
  'py': 'python',
  'c': 'cpp',
  'h': 'cpp',
};

const helloWorldText = `
# Hello world!

Welcome to this Badge IDE in the making :)

## Getting started
Start by making sure you have the latest experimental firmware (> v2.0.3)
installed on your MCH2022 badge. As soon as you have done that, you should be
able to connect to it and start editing files, including Python apps,
directly from your browser!

## Monaco Editor
This built-in Monaco editor is also used in VSCode. Hit F1 to explore the
available actions and shortcuts.
In addition, Ctrl+S will save the currently opened file to the badge.

### Supported languages
Highlighting and basic formatting are currently available for Python, C, C++,
and Markdown. More advanced language features will follow Soon™️.

## Additional shortcuts
* Editor
  * Middle mouse click on tab to close
  * <key>Ctrl+S</key> to save

* File browser
  * <key>Del</key>
`.trimStart();
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
