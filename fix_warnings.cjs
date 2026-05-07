const fs = require('fs');

let badgeContent = fs.readFileSync('src/components/common/WatcherBadge.tsx', 'utf8');
badgeContent = '/* eslint-disable react-refresh/only-export-components */\n' + badgeContent;
fs.writeFileSync('src/components/common/WatcherBadge.tsx', badgeContent);

let headerContent = fs.readFileSync('src/app/AppHeaderSlot.tsx', 'utf8');
headerContent = '/* eslint-disable react-refresh/only-export-components */\n' + headerContent;
fs.writeFileSync('src/app/AppHeaderSlot.tsx', headerContent);
