export default defineNuxtPlugin(nuxtApp => {

  nuxtApp.vueApp.directive('autofocus', {
    mounted: (el) => el.focus()
  });

});
