const fs = require('fs');
let cardContent = fs.readFileSync('apps/web/src/components/movies/MovieCard.tsx', 'utf8');
cardContent = cardContent.replace(
  '            </MediaCardPosterWrap>\n          </Card>',
  '            </MediaCardPosterWrap>\n            </motion.div>\n          </Card>'
);
fs.writeFileSync('apps/web/src/components/movies/MovieCard.tsx', cardContent, 'utf8');
console.log("Fixed closing tag correctly");
