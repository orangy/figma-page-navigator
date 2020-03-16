figma.showUI(__html__, {width: 400, height: 250});

setTimeout(() => {
    let result: { name: string; id: string }[];
    switch (figma.command) {
        case "goto-page":
            result = figma.root.children
                .map(page => ({name: page.name, id: page.id}));
            break;
        case "goto-frame":
            result = figma.currentPage.children
                .filter(child => child.type === "FRAME")
                .map(page => ({name: page.name, id: page.id}));
            break;
        default:
            result = [];
    }

    figma.ui.postMessage({type: 'load', command: figma.command, items: result})
});

figma.ui.onmessage = async msg => {
    switch (msg.type) {
        case 'navigate': {
            switch (figma.command) {
                case "goto-page": {
                    let selected = <PageNode>figma.getNodeById(msg.id);
                    if (selected !== null)
                        figma.currentPage = selected;
                    break;
                }
                case "goto-frame": {
                    let selected = <SceneNode>figma.getNodeById(msg.id);
                    figma.currentPage.selection = [selected];
                    figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection)
                    break;
                }
            }
            break;
        }
        case 'cancel':
            // do nothing, just close plugin
            break;
    }
    figma.closePlugin();
};
