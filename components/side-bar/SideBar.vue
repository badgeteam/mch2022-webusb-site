<template>
  <aside class="sidebar">

    <div class="sidebar-nav">
      <div class="top">
        <button class="sidebar-nav-link" v-for="drawer in drawers.filter(d => d.position == 'top')"
          :class="{ 'active': activeDrawer?.id == drawer.id, 'hidden': !(drawer.visible?.value ?? true) }"
          @click="() => toggleActiveDrawer(drawer.id)"
          >
          <component :is="drawer.icon"></component>
        </button>
      </div>

      <div class="bottom">
        <button class="sidebar-nav-link" v-for="drawer in drawers.filter(d => d.position == 'bottom')"
          :class="{ 'active': activeDrawer?.id == drawer.id, 'hidden': !(drawer.visible?.value ?? true) }"
          @click="() => toggleActiveDrawer(drawer.id)"
          >
          <component :is="drawer.icon"></component>
        </button>
        <!-- <span class="block my-1">{{ meta.version }}</span> -->
        <NuxtLink class="block my-1 text-sm" :to="meta.repoUrl.replace(/(\.git)?$/, `/tree/${meta.ref}`)" target="_blank">{{ meta.ref }}</NuxtLink>
      </div>
    </div>

    <div class="drawer" :class="{ 'open': drawerOpen }">
      <KeepAlive>
        <component :is="activeDrawer?.component" />
      </KeepAlive>
    </div>

  </aside>
</template>

<script lang="ts" setup>
import {
  ArrowsRightLeftIcon,
  CircleStackIcon,
  CommandLineIcon,
  BuildingStorefrontIcon,
  Cog8ToothIcon,
} from '@heroicons/vue/24/outline';
import {
  FilesDrawer,
  HatcheryDrawer,
  USBDrawer
} from './drawers';

const { $BadgeAPI, $connected } = useNuxtApp();

const drawers: Drawer[] = [
  { position: 'top', id: 'files',    component: FilesDrawer,    icon: CircleStackIcon,         visible: $connected },
  { position: 'top', id: 'usb',      component: USBDrawer,      icon: ArrowsRightLeftIcon                          },
  // { position: 'top', id: 'serial',   component: HatcheryDrawer, icon: CommandLineIcon,         visible: $connected },
  // { position: 'top', id: 'hatchery', component: HatcheryDrawer, icon: BuildingStorefrontIcon                       },

  // { position: 'bottom', id: 'settings', component: HatcheryDrawer, icon: Cog8ToothIcon                             },
];
preloadComponents(drawers.map(d => d.component.name!));

const defaultDrawerIndex = drawers.findIndex(d => d.id == 'usb');
const connectDrawerIndex = drawers.findIndex(d => d.id == 'files');

const activeDrawerIndex: Ref<number | null> = ref(defaultDrawerIndex);
const activeDrawer = computed(() => drawerOpen.value ? drawers[activeDrawerIndex.value!] : null);
const drawerOpen = computed(() => activeDrawerIndex.value !== null);

$BadgeAPI.onConnect(() => activeDrawerIndex.value = connectDrawerIndex);
$BadgeAPI.onConnectionLost(() => activeDrawerIndex.value = defaultDrawerIndex);

function toggleActiveDrawer(toggleId: string) {
  if (activeDrawer.value == null || activeDrawer.value.id != toggleId) {
    let index = drawers.findIndex(d => d.id == toggleId);
    activeDrawerIndex.value = index;
  }
  else {
    // activeTab == toggleTab -> close tab
    activeDrawerIndex.value = null;
  }
}

const meta = pkgInfo;

type Drawer = {
  position: 'top' | 'bottom',
  id: string,
  icon: Component,
  component: Component,
  visible?: ComputedRef<boolean>,
};
</script>


<style lang="scss">
@import "~/assets/styles/config";

.sidebar {
  > div {
    vertical-align: top;
  }

  z-index: 10;

  background-color: $surface-color;
  color: $surface-text-color;

  .sidebar-nav {
    height: 100%;
    width: $sidebar-width;

    // display: flex;
    display: inline-flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;

    .sidebar-nav-link {
      $base-padding: calc(($sidebar-width - $sidebar-icon-size) / 2);

      display: block;
      padding: $base-padding;
      height: $sidebar-width;
      width: 100%;

      overflow: hidden;
      &.hidden {
        @apply h-0 py-0;
      }
      transition: 420ms ease-in-out;
      transition-property: height, padding;

      &.active, &:hover {
        color: lighten($surface-text-color, 30%);
      }
      &.active {
        $stripe-width: 2px;
        border-left: $stripe-width solid lighten($surface-text-color, 30%);
        padding-left: calc($base-padding - $stripe-width);
      }

      [data-icon] {
        font-size: $sidebar-icon-size;
        max-width: $sidebar-icon-size;
        max-height: $sidebar-icon-size;
      }
    }
  }

  .drawer {
    width: $sidebar-drawer-width;
    height: 100%;
    resize: horizontal;
    overflow-y: auto;

    display: inline-flex;
    flex-direction: column;
    align-content: stretch;

    background-color: $background-color-elevated;
    color: $text-color-elevated;

    &:not(.open) {
      display: none;
    }

    > * {
      @apply px-3 mt-3 last:mb-3;

      &.section {
        @apply border-y py-2 border-zinc-700;

        &:first-child, + .section {
          @apply border-t-0 mt-0;
        }
        &:last-child {
          @apply border-b-0;
        }
      }

      &.at-bottom {
        @apply mt-auto;
      }
    }

    h2 {
      @apply p-3 text-xl;
      background-color: lighten($background-color-elevated, 4%);

      &:first-child {
        @apply mt-0;
      }
    }
  }
}
</style>
