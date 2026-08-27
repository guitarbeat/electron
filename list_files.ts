import { listSharedStateFilenames } from './api/_lib/sharedStateStore.ts';
listSharedStateFilenames().then(console.log).catch(console.error);
