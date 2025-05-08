import highlight from 'showdown-highlight';

import type { ShowdownExtension } from 'showdown';

const replaceMDLinksToHTML : ShowdownExtension = {
    type: 'lang',
    regex: /\[(.*)\]\((.*)\.md\)/g,
    replace: `[$1]($2.html)`
};

const highlightCode : ShowdownExtension[] = highlight({
    pre: true,
    auto_detection: true
});

export { replaceMDLinksToHTML, highlightCode };
