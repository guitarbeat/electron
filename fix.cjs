const fs = require('fs');

function fix(file, replaceFn) {
    let content = fs.readFileSync(file, 'utf8');
    content = replaceFn(content);
    fs.writeFileSync(file, content);
}

fix('src/components/movies/MoviesTopControls.tsx', (content) => {
    content = content.replace(/import \{ Search, Plus \} from 'lucide-react';/, "import { Search, Plus } from 'lucide-react';");
    return content;
});
