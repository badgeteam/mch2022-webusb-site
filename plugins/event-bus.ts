import { FSNode } from '~/plugins/badgeUSB.client';
import mitt from 'mitt';

type ApplicationEvents = {
  'file:open': string;
  'file:delete': FSNode;
};

export default defineNuxtPlugin((nuxtApp) => {
  const eventBus = mitt<ApplicationEvents>();

  return {
    provide: {
      eventBus,
    },
  };
});
