<template>
  <h2>Badge Filesystems</h2>
  <div>
    <div v-for="[key, storage] in Object.entries(fsState).filter(([k, s]) => s.size > 0)" class="first:mt-0 mt-2">
      <div class="flex justify-between items-end">
        <span class="text-base font-medium text-gray-200">{{ key }}</span>
        <span class="text-sm font-medium text-gray-200">
          {{ (Number(storage.size - storage.free)/Number(storage.size)*100).toFixed(1) }}%
        </span>
      </div>
      <progress class="w-full h-2.5"
        :max="Number(storage.size)" :value="Number(storage.size - storage.free)"
        :title="`${(Number(storage.size - storage.free)/1e3).toFixed(0)} / ${(Number(storage.size)/1e3).toFixed(0)} kB`"
      >
      </progress>
    </div>
  </div>
  <div v-if="$connected">
    <DirView :dirNode="root" displayName="/" root
      @loadDirRequest="(dir, cb) => handleDirRequest(dir, cb)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { DirNode } from '~/plugins/badge-usb.client';
import DirView from './widgets/DirView.vue';

const { $BadgeAPI, $connected, $eventBus, $files } = useNuxtApp();

let fsState: Awaited<ReturnType<NonNullable<typeof $BadgeAPI.fileSystem>['state']>> | {} = reactive({});

const root: DirNode = reactive({
  type: 'dir',
  name: '',
  path: '/',
  loaded: true,
  stat: {
    modified: BigInt(1337),
    size: 1337,
  },
  children: [],
});
$files.directory.set('/', root);

root.children.push({
  parent: root,
  type: 'dir',
  name: 'internal',
  path: '/internal',
  loaded: false,
  children: [],
  stat: {
    modified: BigInt(2022),
    size: 2022,
  },
});
$files.directory.set('/internal', root.children[0]);


$BadgeAPI.onConnect(() => refresh()); // FIXME: should never occur, drawer inaccessible if not connected
onMounted(refresh);

async function refresh(depth = 3) {
  if (!$connected) return false;

  $files.fetchChildren(await $files.getNode('/internal') as DirNode, depth);
  refreshState();
}

async function refreshState() {
  Object.assign(fsState, await $BadgeAPI.fileSystem!.state());
}


function handleDirRequest(dir: DirNode, cb: (err?: any) => void) {
  return $files.updateDir(dir).then(() => { if (cb) cb(); }).catch(cb);
}

$eventBus.on('file:created', node => {
  refreshState();
});

$eventBus.on('file:delete', file => {
  if (!$connected) return;
  $BadgeAPI.fileSystem!.delete(file.path)
  .catch(err => console.warn(`failed to delete ${file.path}:`, err, file))
  .then(success => {
    if (!success) {
      console.warn(`failed to delete`, file);
      return;
    }
    $files.updateDir(file.parent!);
    $eventBus.emit('file:deleted', file);
    refreshState();
  });
});
</script>
