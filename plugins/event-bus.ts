import { FileListing } from '@badge.team/badge-webusb/dist/api/filesystem';
import { FileNode, FSNode } from '~/plugins/badgeUSB.client';
import mitt from 'mitt';

type ApplicationEvents = {
  'file:open': FileNode;
  'file:delete': FSNode;
  'file:created': FSNode;
};

export default defineNuxtPlugin((nuxtApp) => {
  const eventBus = mitt<ApplicationEvents>();

  return {
    provide: {
      eventBus,
    },
  };
});
