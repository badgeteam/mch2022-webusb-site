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
          <!-- <div class="mt-2 text-sm text-green-700">
            <p class="mb-3">
              Please make sure your badge has the latest firmware, and be sure
              to let us know if you have any issues!
            </p>
          </div> -->
        </div>
      </div>
    </div>
  </div>

  <div v-if="$connected">
    <ul class="list-disc ms-5">
      <li>TX packets: {{ stats.txPackets }}</li>
      <li>RX packets: {{ stats.rxPackets }}</li>
      <li>CRC errors: {{ stats.crcErrors }}</li>
      <li>Transactions: {{ stats.transactions }}</li>
      <li>Resync count: {{ stats.timesOutOfSync }}</li>
      <li>Pending transactions: {{ stats.pendingTransactions }}</li>
    </ul>
  </div>

  <div v-if="$connected" class="flex flex-col items-stretch mt-auto">
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

<style lang="scss">
ol li:not(:first-child) {
  @apply mt-1;
}
</style>

<script lang="ts" setup>
import { BadgeUSB } from '@badge.team/badge-webusb/dist/badge-usb';
import { ArrowPathRoundedSquareIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid';
const { $BadgeAPI, $connected } = useNuxtApp();

const webUsbAvailable = !!navigator.usb;
const compatLink = "https://developer.mozilla.org/en-US/docs/Web/API/USB#browser_compatibility";

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

let connecting = ref(false);
$BadgeAPI.onConnect(() => connecting.value = false);

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

</script>
