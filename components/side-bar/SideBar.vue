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
      </div>
    </div>

    <div class="drawer" :class="{ 'open': drawerOpen }">
      <KeepAlive>
        <component :is="activeDrawer?.component" />
      </KeepAlive>
    </div>

  </aside>
</template>

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
      @apply p-3;
    }
    > div {
      &.section {
        @apply border-y border-gray-700;
      }
    }
    h2 {
      @apply py-0 my-2 text-xl;
    }
  }
}
</style>

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
  { position: 'top', id: 'usb',      component: USBDrawer,      icon: ArrowsRightLeftIcon                          },
  { position: 'top', id: 'files',    component: FilesDrawer,    icon: CircleStackIcon,         visible: $connected },
  { position: 'top', id: 'serial',   component: HatcheryDrawer, icon: CommandLineIcon,         visible: $connected },
  { position: 'top', id: 'hatchery', component: HatcheryDrawer, icon: BuildingStorefrontIcon                       },

  { position: 'bottom', id: 'settings', component: HatcheryDrawer, icon: Cog8ToothIcon                             },
];
preloadComponents(drawers.map(d => d.component.name!));

const activeDrawerIndex: Ref<number | null> = ref(0);
const activeDrawer = computed(() => drawerOpen.value ? drawers[activeDrawerIndex.value!] : null);
const drawerOpen = computed(() => activeDrawerIndex.value !== null);

$BadgeAPI.onConnectionLost(() => activeDrawerIndex.value = 0);

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

type Drawer = {
  position: 'top' | 'bottom',
  id: string,
  icon: Component,
  component: Component,
  visible?: ComputedRef<boolean>,
}
</script>
