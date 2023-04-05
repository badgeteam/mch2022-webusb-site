<template>
  <h2>Badge Filesystems</h2>
  <div v-if="$connected">
    <DirView :dirNode="root" displayName="/" root
      @loadDirRequest="(dir, cb) => handleDirRequest(dir, cb)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { DirNode, FSNode } from '~/plugins/badge-usb.client';
import DirView from './widgets/DirView.vue';

const { $BadgeAPI, $connected, $eventBus, $files } = useNuxtApp();

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


async function refresh(depth = 3) {
  if (!$connected) return false;

  $files.fetchChildren(await $files.getNode('/internal') as DirNode, depth);
}

$BadgeAPI.onConnect(() => refresh()); // FIXME: should never occur, drawer inaccessible if not connected
onMounted(refresh);


function handleDirRequest(dir: DirNode, cb: (err?: any) => void) {
  return $files.updateDir(dir).then(() => { if (cb) cb(); }).catch(cb);
}

$eventBus.on('file:created', node => {
  // TODO: focus on created file
});

$eventBus.on('file:delete', file => {
  $BadgeAPI.fileSystem.delete(file.path)
  .catch(err => console.warn(`failed to delete ${file.path}:`, err, file))
  .then(success => {
    if (!success) {
      console.warn(`failed to delete`, file);
      return;
    }
    $files.updateDir(file.parent!);
  });
});
</script>
