import { DirListing, FileListing } from "@badge.team/badge-webusb/dist/api/filesystem";
import { BadgeAPI } from "@badge.team/badge-webusb";

export type FileNode = FileListing & { parent: DirNode, deleted?: boolean };
export type DirNode = DirListing & { parent?: DirNode, children: FSNode[], deleted?: boolean, loaded: boolean };
export type FSNode = DirNode | FileNode;

export type AppMetadata = {
  device: string;
  type: 'esp32' | 'ice40' | 'python';
  category: string;
  slug: string;
  name: string;
  author: string;
  license: string;
  description: string;
  version: number;
  files: {
    name: string;
    url: string;
    size: number;
  }[];
};

export default defineNuxtPlugin((nuxtApp) => {
  const badgeAPI = reactive(new BadgeAPI());
  return {
    provide: {
      BadgeAPI: badgeAPI,
      connected: computed(() => badgeAPI.hasConnectedBadge),
      notConnected: computed(() => !badgeAPI.hasConnectedBadge),

      files: {  // TODO: integrate into BadgeAPI
        directory: new Map<string, FSNode>(),

        /**
         * Finds and returns an FSNode if it exists
         * @param path  The path of the node to find
         * @returns The node at `path`, or `null` if it does not exist
         */
        async getNode(path: string): Promise<FSNode | null> {
          const segments = path.split('/');
          let node = this.directory.get('/')!;
          if (!node) throw new Error('directory is rootless');

          // find nearest ancestor in directory
          let i = segments.length;
          for (; i > 0; i--) {
            let nodePath = segments.slice(0, i).join('/');

            if (this.directory.has(nodePath)) {
              node = this.directory.get(nodePath)!;
              break;
            }
          }
          // climb file tree
          for (; i < segments.length; i++) {
            if (node.path != path && node.type == 'dir') {
              if (!node.loaded || i == segments.length - 1) {
                await this.updateDir(node);
              }

              let found = node.children.find(n => n.name == segments[i]);
              if (!found) return null;
              node = found;
            }
          }
          if (node.path != path) return null;
          return node;
        },

        async loadDir(dir: DirListing, depth = 1): Promise<DirNode> {
          const _loadChildren = depth > 1;

          let dirNode: DirNode = {
            ...dir,
            loaded: _loadChildren,
            children: [],
          };
          if (_loadChildren)
            dirNode.children = await this.fetchChildren(
              dirNode,
              depth !== undefined ? depth - 1 : undefined
            );

          return dirNode;
        },

        async fetchChildren(
          dir: DirNode,
          depth: number = Infinity,
          maxAttempts = 3,
        ): Promise<FSNode[]> {
          if (depth == 0) return Promise.resolve([]);

          let attempts = 0;
          while (true) {
            attempts++;

            try {
              return await badgeAPI.fileSystem.list(dir.path)
              .then(async children => {
                children.sort((a, b) => a.type.localeCompare(b.type)*2 + a.name.localeCompare(b.name));

                let childNodes: FSNode[] = [];
                for (let i = 0; i < children.length; i++) {
                  let child = children[i];

                  if (child.type == 'file') {
                    const fileNode: FileNode = {
                      ...child,
                      parent: dir,
                    };
                    this.directory.set(fileNode.path, fileNode);
                    childNodes.push(fileNode);
                  }
                  else {
                    const dirNode: DirNode = await this.loadDir(child, depth);
                    dirNode.parent = dir;
                    this.directory.set(dirNode.path, dirNode);
                    childNodes.push(dirNode);
                  }
                }
                return childNodes;
              });

            } catch (error) {
              if (attempts >= maxAttempts) throw error;
              console.debug('FSLS attempt', attempts, 'for', dir.path, 'failed with', error);
            }
          }
        },

        async updateDir(dir: DirNode, loadUnloaded = true): Promise<void> {
          if (!dir.loaded) {
            dir.children = await this.fetchChildren(dir, 1);
            dir.loaded = true;
            return;
          }

          const cached = dir.children;
          cached.sort((a, b) => a.name.localeCompare(b.name));

          const current = await this.fetchChildren(dir, 1);
          current.sort((a, b) => a.name.localeCompare(b.name));

          for (let i = 0; i < cached.length || i < current.length; i++) {
            let diff: number;
            if (!cached[i])       diff = 1;
            else if (!current[i]) diff = -1;
            else diff = cached[i].name.localeCompare(current[i].name);

            if (diff < 0) {
              // file in cache but not on badge
              this.directory.delete(cached[i].path);
              cached.splice(i, 1);
              i--;
            }
            else if (diff > 0) {
              // file on badge but not in cache
              cached.splice(i, 0, current[i]);
              this.directory.set(cached[i].path, cached[i]);
            }
            else if (diff === 0) {
              if (cached[i].type != current[i].type) {
                cached[i] = current[i];
              }

              if (
                cached[i].stat != null &&
                current[i].stat != null &&
                cached[i].stat!.modified < current[i].stat!.modified // file on badge is newer
              ) {
                if (cached[i].type == 'dir') {
                  let _c = cached[i] as DirNode;
                  Object.assign(cached[i], current[i], {
                    children: _c.children,
                    loaded: _c.loaded,
                  });
                } else {
                  cached[i] = current[i];
                }
              }

              this.directory.set(cached[i].path, cached[i]);
            }
          }

          let childDirs =
            (dir.children.filter((cn) => cn.type == 'dir') as DirNode[])
            .filter((cd) => (cd as DirNode).loaded || loadUnloaded);

          for (let i = 0; i < childDirs.length; i++) {
            await this.updateDir(childDirs[i], false);
          }
        },

        async calculateDirSize(dir: DirNode): Promise<number> {
          await this.updateDir(dir, false);

          let dirTotal = 0;
          for (let i = 0; i < dir.children.length; i++) {
            let node = dir.children[i];
            dirTotal += node.type == 'file' ? (node.stat?.size ?? 0) : await this.calculateDirSize(node);
          }
          return dirTotal;
        },
      }
    }
  }
})
