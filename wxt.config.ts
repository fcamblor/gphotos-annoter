import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entrypoints',

  manifest: {
    name: 'GPhotos Estate Annotator',
    description: 'Annotate Google Photos for estate inventory management',
    permissions: ['identity', 'storage', 'activeTab'],
    host_permissions: [
      'https://photos.google.com/*',
      'https://sheets.googleapis.com/*',
    ],
  },
});
