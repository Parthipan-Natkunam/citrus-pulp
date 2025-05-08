import type { ShowdownExtension } from 'showdown';

const replaceMDLinksToHTML : ShowdownExtension = {
    type: 'lang',
    regex: /\[(.*)\]\((.*)\.md\)/g,
    replace: `[$1]($2.html)`
};

export { replaceMDLinksToHTML };
