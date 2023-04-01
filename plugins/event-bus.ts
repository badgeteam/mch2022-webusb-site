import mitt from "mitt";

type ApplicationEvents = {
  'file:open': string,
};

export default defineNuxtPlugin(nuxtApp => {
  const eventBus = mitt<ApplicationEvents>();

  return {
    provide: {
      eventBus,
    }
  }
})
