import { readSharedStateFile } from './api/_lib/sharedStateStore.ts';
readSharedStateFile('movielist.json').then(data => console.log(JSON.stringify(JSON.parse(data), null, 2))).catch(console.error);
