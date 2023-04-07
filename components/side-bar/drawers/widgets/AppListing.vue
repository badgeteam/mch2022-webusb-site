<template>
  <li>
    <a href="#" class="block bg-zinc-900 rounded-md hover:bg-zinc-700">
      <div class="p-4 pt-3">

        <div class="flex items-baseline justify-between">
          <p class="truncate font-medium lh-1 text-indigo-400">
            {{ 'name' in appMeta ? appMeta.name : props.app.name }}
          </p>

          <div class="ml-2 flex flex-shrink-0">
            <Loading v-if="loading" :size="5" class="me-2" />
            <p class="inline-flex rounded-full bg-green-300 px-2 text-xs font-semibold leading-5 text-green-800">
              {{ /* props.app.type */ 'ESP32' }}
            </p>
          </div>
        </div>

        <div class="mt-2 sm:flex sm:justify-between">
          <div>
            <p v-if="'author' in appMeta" class="flex items-center text-sm text-gray-500">
              <UserCircleIcon class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              {{ appMeta.author }}
            </p>
            <p v-if="'category' in appMeta" class="mt-2 flex items-center text-sm text-gray-500">
              <TagIcon class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              {{ appMeta.category }}
            </p>
          </div>

          <div>
            <div class="flex items-center text-sm text-gray-500">
              <CircleStackIcon class="mr-1 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <p>{{ props.app.size > 10e3 ? (props.app.size/1e3).toFixed(1) + ` kB` : props.app.size }}</p>
            </div>
            <div v-if="'license' in appMeta" class="mt-2 flex items-center text-sm text-gray-500">
              <DocumentCheckIcon class="mr-1 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <p>{{ appMeta.license }}</p>
            </div>
          </div>
        </div>

      </div>
    </a>
  </li>
</template>

<script lang="ts" setup>
import type { AppMetadata } from '~/plugins/badge-usb.client';
import type { AppListing } from '@badge.team/badge-webusb/dist/api/appfs';
import { CircleStackIcon, DocumentCheckIcon, TagIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
const { $BadgeAPI, $connected } = useNuxtApp();

const props = defineProps({
  app: {
    type: Object as PropType<AppListing>,
    required: true,
  }
});

let loading = ref(false);

const appMeta: Partial<AppMetadata> = reactive({});

async function loadMetadata() {
  if (!$connected) return;
  loading.value = true;

  const basePath = `/internal/apps/esp32/${props.app.name}`;
  const iconPath     = `${basePath}/icon.png`;
  const metadataPath = `${basePath}/metadata.json`;

  console.debug('trying to load metadata for', props.app.name);
  if (!await $BadgeAPI.fileSystem!.exists(metadataPath)) {
    console.debug(metadataPath, 'does not exist');
    loading.value = false;
    return;
  }

  const metaJson = await readFileText(metadataPath);
  if (metaJson) {
    try {
      Object.assign(appMeta, JSON.parse(metaJson));
    } catch (error) {
      console.log('Error parsing', metadataPath, metaJson);
    }
  }
  loading.value = false;
}

onMounted(() => {
  loadMetadata();
});

async function readFileText(path: string): Promise<string> {
  let rawContent = await $BadgeAPI.fileSystem!.readFile(path);
  return $BadgeAPI.textDecoder.decode(rawContent);
}

</script>
