import { readSharedStateFile } from './api/_lib/sharedStateStore.ts';
readSharedStateFile('movielist.json').then(data => {
  const movies = JSON.parse(data);
  const bass = movies.find(m => m.title.toLowerCase().includes('bass'));
  console.log(bass);
}).catch(console.error);
