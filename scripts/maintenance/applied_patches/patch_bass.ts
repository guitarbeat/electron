import { readSharedStateFile, patchSharedStateFile } from './api/_lib/sharedStateStore.ts';
async function patch() {
  const data = await readSharedStateFile('movielist.json');
  const movies = JSON.parse(data);
  const bass = movies.find(m => m.title.toLowerCase().includes('bass'));
  if (bass) {
    bass.mediaType = "youtube";
    bass.youtubeUrl = "https://www.youtube.com/watch?v=S-OgkNgxm3k";
    bass.year = "2023";
    bass.customPosterUrl = "https://img.youtube.com/vi/S-OgkNgxm3k/maxresdefault.jpg";
    await patchSharedStateFile('movielist.json', JSON.stringify(movies, null, 2));
    console.log("Patched successfully!");
  } else {
    console.log("Not found.");
  }
}
patch().catch(console.error);
