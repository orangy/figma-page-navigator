figma.showUI(__html__, {width: 400, height: 250});


setTimeout(function () {
    let ref = []
    const pages = figma.root.children;
    pages.forEach(page => {
        ref.push({name: page.name, id: page.id})
    });
    figma.ui.postMessage({type: 'loadPages', pages: ref})

});

figma.ui.onmessage = async msg => {
    switch (msg.type) {
        case 'select-page':
            let pageId = msg.pageId;
            let selected = figma.root.children.filter(page => page.id === pageId);
            if (selected.length > 0)
                figma.currentPage = selected[0];
            break;
        case 'cancel':
            // do nothing, just close plugin
            break;
    }
    figma.closePlugin();
};
