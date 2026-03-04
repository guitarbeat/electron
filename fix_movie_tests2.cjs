const fs = require('fs');
const testFile = 'services/movieService.test.ts';
let code = fs.readFileSync(testFile, 'utf8');

// Also for `getMovies throws error on network failure` it currently expects `movies.length, 5`
// let's ensure it's written properly
code = code.replace(
  `const movies = await getMovies();
    assert.equal(movies.length, 5);`,
  `const resultMovies = await getMovies();\n    assert.equal(resultMovies.length, 5);`
);

fs.writeFileSync(testFile, code);
