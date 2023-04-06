<template>
  <!-- Not connected -->
  <div v-if="webUsbAvailable && !$connected">
    <div class="rounded-md bg-blue-200 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <InformationCircleIcon class="h-7 w-6 text-blue-500" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-blue-900">Connect your badge</h3>
          <div class="mt-2 text-sm text-blue-700">
            <p class="mb-3">
              Please make sure your badge has the latest firmware, and let us
              know if you have any issues!
            </p>
            <ol class="list-decimal">
              <li>Connect your badge to the computer with a USB cable</li>
              <li>Click the <button class="btn-xs-primary with-icon" @click="connect"><ArrowPathRoundedSquareIcon/> Connect</button> button</li>
              <li>Choose your device</li>
              <li>Magic ✨</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
    <button class="btn-block-primary with-icon mt-3" @click="connect" :disabled="connecting">
      <ArrowPathRoundedSquareIcon/>
      Connect
    </button>
  </div>

  <!-- Connected -->
  <div v-if="$connected">
    <div class="rounded-md bg-green-200 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <CheckCircleIcon class="h-7 w-6 text-green-500" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-green-900">Connected</h3>
        </div>
      </div>
    </div>
  </div>
  <div v-if="$connected" class="section">
    <h3>Connection metrics</h3>
    <table class="stats">
      <tr><td>TX packets:</td><td>{{ stats.txPackets }}</td></tr>
      <tr><td>RX packets:</td><td>{{ stats.rxPackets }}</td></tr>
      <tr><td>Transactions:</td><td>{{ stats.transactions }}</td></tr>
      <tr><td>CRC errors:</td><td>{{ stats.crcErrors }}</td></tr>
      <tr><td>Resync count:</td><td>{{ stats.timesOutOfSync }}</td></tr>
      <tr><td>Pending transactions:</td><td>{{ stats.pendingTransactions }}</td></tr>
    </table>
  </div>
  <div v-if="$connected" class="section">
    <h3>Settings</h3>
    <div class="flex flex-col">
      <div v-for="{ title, value }, key in settings.switches" class="my-2 px-4 flex items-center justify-between">
        <span>{{ title }}</span>
        <Switch v-model="settings.switches[key].value" :class="[value ? 'bg-indigo-600' : 'bg-gray-200', 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2']">
          <span class="sr-only">Use setting</span>
          <span aria-hidden="true" :class="[value ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']" />
        </Switch>
      </div>
    </div>
    <div v-if="Object.values(settings.switches).some(sw => sw.value)"
      class="mt-4 rounded-md bg-blue-200 p-4"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <InformationCircleIcon class="h-5 w-5 text-blue-500" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-blue-900">RX/TX data is dumped to console</h4>
          <div class="mt-2 text-xs text-blue-700">
            <p>
              Open DevTools to view the debug log.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="$connected" class="at-bottom flex flex-col items-stretch">
    <div class="btn-group">
      <button class="btn-danger with-icon w-1/2" @click="disconnect">
        <XMarkIcon/>
        Disconnect
      </button>
      <button class="btn-warn with-icon w-1/2" @click="reset">
        <ArrowPathRoundedSquareIcon/>
        Reset
      </button>
    </div>
  </div>

  <!-- Browser not supported -->
  <div v-if="!webUsbAvailable">
    <div class="rounded-md bg-red-200 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <XCircleIcon class="h-7 w-6 text-red-500" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-red-900">Browser not supported</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>
              Your browser does not seem to support WebUSB, try using a
              <a :href="compatLink" class="text-link" target="_blank">suitable browser</a>.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
h3 {
  @apply text-lg;
}
table.stats {
  @apply border-separate border-spacing-x-4 border-spacing-y-2;

  td:nth-child(2) {
    @apply text-right;
  }
}
</style>

<script lang="ts" setup>
import { Switch } from '@headlessui/vue';
import type { BadgeUSB } from '@badge.team/badge-webusb/dist/badge-usb';
import { ArrowPathRoundedSquareIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid';
const { $BadgeAPI, $connected } = useNuxtApp();

const webUsbAvailable = !!navigator.usb;
const compatLink = "https://developer.mozilla.org/en-US/docs/Web/API/USB#browser_compatibility";

let connecting = ref(false);
$BadgeAPI.onConnect(() => connecting.value = false);

const settings = reactive({
  switches: {
    'debug-rx': {
      title: 'RX debug mode',
      get value() { return $BadgeAPI.badge?.debug.rx ?? false },
      set value(v: boolean) { if ($BadgeAPI.badge) $BadgeAPI.badge.debug.rx = v },
    },
    'debug-tx': {
      title: 'TX debug mode',
      get value() { return $BadgeAPI.badge?.debug.tx ?? false },
      set value(v: boolean) { if ($BadgeAPI.badge) $BadgeAPI.badge.debug.tx = v },
    },
  },
});

async function connect() {
  if ($connected.value || connecting.value) return null;
  connecting.value = true;

  await $BadgeAPI.connect()
  .then(() => console.debug('BadgeAPI', $BadgeAPI))
  .catch(err => {
    console.warn('Connecting to badge failed; did user cancel?', err);
    connecting.value = false;
  });
}

async function disconnect() {
  if (!$connected.value) return null;

  return $BadgeAPI.disconnect().catch(() => false);
}

async function reset() {
  if (!$connected.value) return null;
  await $BadgeAPI.badge!.controlReset();
}

let stats: BadgeUSB['connectionStats'] = reactive({
  rxPackets: 0,
  txPackets: 0,
  crcErrors: 0,
  transactions: 0,
  timesOutOfSync: 0,
  pendingTransactions: 0,
});
setInterval(() => {
  if (!$connected.value) return;
  Object.assign(stats, $BadgeAPI.badge!.connectionStats);
}, 200);

</script>
