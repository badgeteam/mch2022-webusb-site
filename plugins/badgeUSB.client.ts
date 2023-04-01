import { BadgeAPI } from "@badge.team/badge-webusb";

export default defineNuxtPlugin(nuxtApp => {
  const badgeAPI = reactive(new BadgeAPI());
  return {
    provide: {
      BadgeAPI: badgeAPI,
      connected: computed(() => badgeAPI.hasConnectedBadge),
      notConnected: computed(() => !badgeAPI.hasConnectedBadge),
    }
  }
})
