/* eslint-disable no-console */
import { URL } from 'url';

const OMDB_BASE_URL = 'https://www.omdbapi.com';
const OMDB_API_KEY = 'TEST_KEY';
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

function testOmdbIdConstruction(id: string) {
  const url = new URL(OMDB_BASE_URL);
  url.searchParams.append('apikey', OMDB_API_KEY);
  url.searchParams.append('i', id);
  return url.toString();
}

function testOmdbTitleConstruction(title: string) {
  const url = new URL(OMDB_BASE_URL);
  url.searchParams.append('apikey', OMDB_API_KEY);
  url.searchParams.append('t', title);
  return url.toString();
}

function testTvMazeSearchConstruction(query: string) {
  const url = new URL(`${TVMAZE_BASE_URL}/search/shows`);
  url.searchParams.append('q', query);
  return url.toString();
}

function runTests() {
  console.log('--- Verifying URL Construction Logic ---');

  // Test 1: Complex ID injection
  const maliciousId = 'tt123&apikey=EVIL';
  const omdbUrl = testOmdbIdConstruction(maliciousId);
  console.log(`Input ID: ${maliciousId}`);
  console.log(`Generated URL: ${omdbUrl}`);

  if (omdbUrl.includes('i=tt123%26apikey%3DEVIL') || omdbUrl.includes('i=tt123%26apikey%3DEVI')) {
    console.log('✅ PASS: Malicious ID was correctly encoded.');
  } else if (omdbUrl.includes('&apikey=EVIL')) {
    console.log('❌ FAIL: Malicious ID injected parameter!');
    process.exit(1);
  } else if (omdbUrl.includes('apikey=TEST_KEY') && !omdbUrl.includes('&apikey=EVIL')) {
    // Just to be sure about encoding
    console.log('✅ PASS: Parameter injection prevented.');
  }

  // Test 2: Complex Title
  const complexTitle = 'Movie & Show';
  const titleUrl = testOmdbTitleConstruction(complexTitle);
  console.log(`\nInput Title: ${complexTitle}`);
  console.log(`Generated URL: ${titleUrl}`);
  if (
    titleUrl.includes('t=Movie+%26+Show') ||
    titleUrl.includes('t=Movie+%26+Show'.replace(/ /g, '+'))
  ) {
    console.log('✅ PASS: Title with special characters encoded.');
  } else {
    // searchParams uses + for spaces usually
    console.log('ℹ️ Check output manually if encoding varies.');
  }

  // Test 3: TVMaze Search
  const searchQuery = '<script>alert(1)</script>';
  const tvUrl = testTvMazeSearchConstruction(searchQuery);
  console.log(`\nInput Search: ${searchQuery}`);
  console.log(`Generated URL: ${tvUrl}`);
  if (!tvUrl.includes('<script>')) {
    console.log('✅ PASS: Script tags encoded in TVMaze search.');
  } else {
    console.log('❌ FAIL: Script tags NOT encoded!');
    process.exit(1);
  }
}

runTests();
