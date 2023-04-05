import { FileNode, FSNode } from '~/plugins/badge-usb.client';
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
