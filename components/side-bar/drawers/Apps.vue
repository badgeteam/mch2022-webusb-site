<template>
  <h2>Apps</h2>
  <div>
    <div v-for="[key, storage] in Object.entries(fsState).filter(([k, s]) => s.size > 0 && k == 'app')" class="first:mt-0 mt-2">
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

  <div v-if="$connected" class="overflow-hidden">
    <ul role="list" class="divide-y divide-zinc-500">
      <AppListing v-for="app in appList" :app="app" />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { AppListing as AppFSListing } from '@badge.team/badge-webusb/dist/api/appfs';
import AppListing from './widgets/AppListing.vue';

const { $BadgeAPI, $connected, $eventBus } = useNuxtApp();

let fsState: Awaited<ReturnType<NonNullable<typeof $BadgeAPI.fileSystem>['state']>> | {} = reactive({});

const appList = ref<AppFSListing[]>([]);

$BadgeAPI.onConnect(() => refresh()); // FIXME: should never occur, drawer inaccessible if not connected
onMounted(refresh);

async function refresh() {
  if (!$connected) return false;

  $BadgeAPI.appFS!.list().then(list => appList.value = list);
  refreshState();
}

async function refreshState() {
  Object.assign(fsState, await $BadgeAPI.fileSystem!.state());
}
</script>
