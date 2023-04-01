<template>
  <h2>Badge Filesystems</h2>
  <div v-if="$connected">
    <DirView :dirNode="treeRoot" displayName="/" :dummy="true" open
      @loadDirRequest="(dir, cb) => handleDirRequest(dir, cb)"
    />
  </div>
</template>

<script lang="ts" setup>
import { FileListing } from '@badge.team/badge-webusb/dist/api/filesystem';
import DirView from './widgets/DirView.vue';

export type DirListing = FileListing & { type: 'dir' };
export type FileNode = FileListing & { type: 'file', parent: DirNode };
export type DirNode = FileListing & { type: 'dir', parent?: DirNode, children: FSNode[], loaded: boolean };
export type FSNode = DirNode | FileNode;

const { $BadgeAPI, $connected } = useNuxtApp();

const internalStorage: DirNode = {
  type: 'dir',
  name: 'internal',
  path: '/internal',
  loaded: false,
  children: [],
  stat: {
    modified: BigInt(2022),
    size: 2022,
  },
};
const rootNode: DirNode = {
  type: 'dir',
  name: '',
  path: '/',
  loaded: true,
  stat: {
    modified: BigInt(1337),
    size: 1337,
  },
  children: [ internalStorage ],
};
internalStorage.parent = rootNode;

const treeRoot: FSNode = reactive(rootNode);
const directory = new Map<string, FSNode>();
directory.set('/', rootNode);
directory.set('/internal', internalStorage);


async function refresh(depth = 3) {
  if (!$connected) return false;

  fetchChildren(internalStorage, depth);
}

$BadgeAPI.onConnect(() => refresh()); // FIXME: should never occur, drawer inaccessible if not connected
onMounted(refresh);


function handleDirRequest(dir: DirNode, cb: (err?: any) => void) {
  return updateDir(dir).then(() => { if (cb) cb(); }).catch(cb);
}

async function updateDir(dir: DirNode, loadUnloaded = true): Promise<void> {
  if (!dir.loaded) {
    dir.children = await fetchChildren(dir, 1);
    dir.loaded = true;
    return;
  }

  dir.children.sort((a, b) => a.name.localeCompare(b.name));
  const cached = dir.children;

  const current = await fetchChildren(dir, 1)
  .then(nodes =>
    nodes.sort((a, b) => a.name.localeCompare(b.name))
  );

  for (let i = 0; i < cached.length || i < current.length; i++) {
    let diff = cached[i].name.localeCompare(current[i].name);

    if (diff < 0) { // file in cache but not on badge
      directory.delete(cached[i].path);
      cached.splice(i, 1);
      i--;
    }
    else if (diff > 0) { // file on badge but not in cache
      cached.unshift(current[i]);
      directory.set(cached[0].path, cached[0]);
    }
    else if (diff === 0) {
      if (cached[i].type != current[i].type) {
        cached[i] = current[i];
      }

      if (
        cached[i].stat != null && current[i].stat != null
        && (cached[i].stat!.modified < current[i].stat!.modified) // file on badge is newer
      ) {
        if (cached[i].type == 'dir') {
          let _c = cached[i] as DirNode;
          Object.assign(cached[i], current[i], { children: _c.children, loaded: _c.loaded });
        }
        else {
          cached[i] = current[i];
        }
      }

      directory.set(cached[i].path, cached[i]);
    }
  }

  dir.children.filter(cn => cn.type == 'dir')
  .filter(cd => (cd as DirNode).loaded || loadUnloaded)
  .forEach(cd => updateDir((cd as DirNode), false));
}

async function loadDir(dir: DirListing, depth = 1): Promise<DirNode> {

  const _loadChildren = depth > 1;

  let dirNode: DirNode = {
    ...dir,
    loaded: _loadChildren,
    children: [],
  };
  if (_loadChildren) await fetchChildren(
    dirNode,
    depth !== undefined ? depth - 1 : undefined,
  );

  return dirNode;
}


async function fetchChildren(dir: DirNode, depth: number = Infinity): Promise<FSNode[]> {
  if (depth == 0) return Promise.resolve([]);

  return $BadgeAPI.fileSystem.list(dir.path)
  .then(nodes => Promise.all(
    nodes.map(async node => {
      if (node.type == 'file') {
        const fileNode: FileNode = {
          ...node as FileNode,
          parent: dir,
        };
        directory.set(fileNode.path, fileNode);
        return fileNode;
      }
      else {
        const dirNode: DirNode = await loadDir(node as DirListing, depth);
        dirNode.parent = dir;
        directory.set(dirNode.path, dirNode);
        return dirNode;
      }
    })
  ));
}
</script>
