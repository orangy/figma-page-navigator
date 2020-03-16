figma.showUI(__html__, {width: 400, height: 250});


switch (figma.command) {
    case "goto-page":
        figma.clientStorage.getAsync("filter-page").then(filter => {
            figma.ui.postMessage({type: 'init-page', filter: filter})
            load("page", figma.currentPage.id);
        });
        break;
    case "goto-frame":
        figma.clientStorage.getAsync("filter-frame").then(filter => {
            figma.ui.postMessage({type: 'init-frame', filter: filter})
            let selection = figma.currentPage.selection
            if (selection.length == 0) {
                load("frame", undefined);
            } else {
                let node : BaseNode = selection[0];
                while (node.parent && node.parent.type !== "PAGE") {
                    node = node.parent;
                }
                if (node.type == "FRAME")
                    load("frame", node.id)
                else
                    load("frame", undefined);
            }
        });
        break;
}

function load(data: string, active: string) {
    let result: { name: string; id: string }[];
    switch (data) {
        case "page":
            result = figma.root.children
                .map(page => ({name: page.name, id: page.id}));
            break;
        case "frame":
            result = figma.currentPage.children
                .filter(child => child.type === "FRAME")
                .map(page => ({name: page.name, id: page.id}));
            break;
        default:
            result = [];
    }

    figma.ui.postMessage({type: 'load', items: result, active: active})
}

figma.ui.onmessage = async msg => {
    switch (msg.type) {
        case 'navigate': {
            switch (figma.command) {
                case "goto-page": {
                    let selected = <PageNode>figma.getNodeById(msg.id);
                    if (selected !== null)
                        figma.currentPage = selected;

                    await figma.clientStorage.setAsync("filter-page", msg.filter)
                    break;
                }
                case "goto-frame": {
                    let selected = <SceneNode>figma.getNodeById(msg.id);
                    figma.currentPage.selection = [selected];
                    figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection)
                    await figma.clientStorage.setAsync("filter-frame", msg.filter)
                    break;
                }
            }
            break;
        }
        case 'cancel':
            switch (figma.command) {
                case "goto-page":
                    await figma.clientStorage.setAsync("filter-page", msg.filter)
                    break;
                case "goto-frame":
                    await figma.clientStorage.setAsync("filter-frame", msg.filter)
                    break;
            }
            break;
    }
    figma.closePlugin();
};
