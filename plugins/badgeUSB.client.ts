import { FileListing } from "@badge.team/badge-webusb/dist/api/filesystem";
import { BadgeAPI } from "@badge.team/badge-webusb";

export type DirListing = FileListing & { type: 'dir' };
export type FileNode = FileListing & { type: 'file', parent: DirNode };
export type DirNode = FileListing & { type: 'dir', parent?: DirNode, children: FSNode[], loaded: boolean };
export type FSNode = DirNode | FileNode;

export default defineNuxtPlugin((nuxtApp) => {
  const badgeAPI = reactive(new BadgeAPI());
  return {
    provide: {
      BadgeAPI: badgeAPI,
      connected: computed(() => badgeAPI.hasConnectedBadge),
      notConnected: computed(() => !badgeAPI.hasConnectedBadge),

      files: {  // TODO: integrate into BadgeAPI
        directory: new Map<string, FSNode>(),

        async updateDir(dir: DirNode, loadUnloaded = true): Promise<void> {
          if (!dir.loaded) {
            dir.children = await this.fetchChildren(dir, 1);
            dir.loaded = true;
            return;
          }

          dir.children.sort((a, b) => a.name.localeCompare(b.name));
          const cached = dir.children;

          const current = await this.fetchChildren(dir, 1).then((nodes) =>
            nodes.sort((a, b) => a.name.localeCompare(b.name))
          );

          for (let i = 0; i < cached.length || i < current.length; i++) {
            let diff = cached[i].name.localeCompare(current[i].name);

            if (diff < 0) {
              // file in cache but not on badge
              this.directory.delete(cached[i].path);
              cached.splice(i, 1);
              i--;
            } else if (diff > 0) {
              // file on badge but not in cache
              cached.unshift(current[i]);
              this.directory.set(cached[0].path, cached[0]);
            } else if (diff === 0) {
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

          dir.children
            .filter((cn) => cn.type == 'dir')
            .filter((cd) => (cd as DirNode).loaded || loadUnloaded)
            .forEach((cd) => this.updateDir(cd as DirNode, false));
        },

        async loadDir(dir: DirListing, depth = 1): Promise<DirNode> {
          const _loadChildren = depth > 1;

          let dirNode: DirNode = {
            ...dir,
            loaded: _loadChildren,
            children: [],
          };
          if (_loadChildren)
            await this.fetchChildren(
              dirNode,
              depth !== undefined ? depth - 1 : undefined
            );

          return dirNode;
        },

        async fetchChildren(
          dir: DirNode,
          depth: number = Infinity
        ): Promise<FSNode[]> {
          if (depth == 0) return Promise.resolve([]);

          return badgeAPI.fileSystem.list(dir.path)
          .then(nodes => Promise.all(
            nodes.map(async node => {
              if (node.type == 'file') {
                const fileNode: FileNode = {
                  ...node as FileNode,
                  parent: dir,
                };
                this.directory.set(fileNode.path, fileNode);
                return fileNode;
              }
              else {
                const dirNode: DirNode = await this.loadDir(node as DirListing, depth);
                dirNode.parent = dir;
                this.directory.set(dirNode.path, dirNode);
                return dirNode;
              }
            })
          ));
        }
      }
    }
  }
})
