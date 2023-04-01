import { defineNuxtModule, addWebpackPlugin, extendWebpackConfig } from "@nuxt/kit";
import MonacoEditorWebpackPlugin from "monaco-editor-webpack-plugin";
import path from 'path';

export default defineNuxtModule({
  setup(_options, _nuxt) {

    addWebpackPlugin(new MonacoEditorWebpackPlugin({
      languages: ['python', 'json', 'markdown', 'cpp', 'rust'],
      features: ['quickCommand', 'find', 'folding'],
    }));

    extendWebpackConfig((config) => {
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "vscode": path.resolve("../node_modules/monaco-languageclient/lib/vscode-compatibility"),
        }
      }
    });

  }
})
