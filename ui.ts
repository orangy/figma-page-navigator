import './ui.css'

const list = document.getElementById("list")
const caption = document.getElementById("caption")
const loadingMessage = document.getElementById("loading-message")
const search = <HTMLInputElement>document.getElementById("search");

search.focus()

setTimeout(() => {
    const loader = document.getElementById("loader")
    if (loader)
        loader.style.display = "block"
}, 200)

onmessage = (event) => {
    const pluginMessage = event.data.pluginMessage

    switch (pluginMessage.type) {
        case "init-page":
            caption.innerText = "Go to Page"
            loadingMessage.innerText = "Loading pages…"
            if (pluginMessage.filter) {
                search.value = pluginMessage.filter;
                search.setSelectionRange(0, search.value.length)
            }
            break;
        case "init-frame":
            caption.innerText = "Go to Frame"
            loadingMessage.innerText = "Loading frames…"
            if (pluginMessage.filter) {
                search.value = pluginMessage.filter;
                search.setSelectionRange(0, search.value.length)
            }
            break;
        case "load":
            const filter = search.value.toUpperCase().trim();
            const lastActive = pluginMessage.active;
            let activeSet = !!lastActive;
            let contents = ""
            pluginMessage.items.forEach((item: any) => {
                const visibility = filter.length == 0 || item.name.toUpperCase().indexOf(filter) >= 0 ? "block" : "none";
                let activeness = ""
                if ((!activeSet && visibility == 'block') || (lastActive === item.id)) {
                    activeSet = true;
                    activeness = "active"
                }

                contents += `<li data-id="${(item.id)}" class="${activeness}" style="display: ${visibility}"><a href="#"><div class="name">${(item.name)}</div></a></li>`;
            })
            list.innerHTML = contents;
            const found = findActive();
            if (found)
                found.element.scrollIntoView({behavior: "auto", block: "center", inline: "start"});

            setTimeout(() => startListening(), 100)
            break;
        default:
            caption.innerText = "Unrecognized command!"
            break;
    }
}

document.addEventListener('keydown', event => {
    if (event.isComposing) return; // do not filter before IME finishes

    const items = list.getElementsByTagName("li");

    let active = null;
    let handled = false;

    switch (event.code) {
        case "Escape":
            parent.postMessage({pluginMessage: {type: 'cancel', filter: search.value}}, '*')
            return;
        case "ArrowDown": {
            let first = null;
            for (let i = 0; i < items.length; i++) {
                let element = items[i];
                if (element.style.display == "none")
                    continue; // ignore hidden

                if (first == null)
                    first = element; // remember first non-hidden item for cyclic

                if (active !== null) {
                    active.classList.remove("active");
                    element.classList.add("active");
                    first = null;
                    active = element;
                    break;
                }

                if (element.classList.contains("active")) {
                    active = element;
                }
            }

            if (active !== null && first !== null) {
                active.classList.remove("active");
                first.classList.add("active");
                active = first;
            }

            handled = true;
            break;
        }
        case "ArrowUp": {
            let previous = null;
            for (let i = 0; i < items.length; i++) {
                let element = items[i];
                if (element.style.display == "none")
                    continue; // ignore hidden

                if (element.classList.contains("active")) {
                    if (previous !== null) {
                        element.classList.remove("active");
                        previous.classList.add("active");
                        active = previous;
                        previous = null;
                        break;
                    }
                    active = element;
                }
                previous = element;
            }

            if (active !== null && previous !== null) {
                active.classList.remove("active");
                previous.classList.add("active");
                active = previous;
            }

            handled = true;
            break;
        }
        case "Enter":
            const found = findActive();
            if (found)
                parent.postMessage({pluginMessage: {type: 'navigate', id: found.id, filter: search.value}}, '*')
            handled = true;
            break;
    }

    if (handled) {
        if (active !== null) {
            active.scrollIntoView({behavior: "auto", block: "nearest", inline: "start"});
        }

        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
        event.cancelBubble = true;
    }
})

function findActive() {
    const items = list.getElementsByTagName("li");
    for (let i = 0; i < items.length; i++) {
        let element = items[i];
        if (element.classList.contains("active")) {
            const id = element.attributes.getNamedItem("data-id").value;
            return {id: id, element: element}
        }
    }
    return {}
}

function filterItems() {
    const items = list.getElementsByTagName("li");
    const filter = search.value.toUpperCase().trim();
    let active = null;
    let firstVisible = null
    let a: any, txtValue: any;
    for (let i = 0; i < items.length; i++) {
        let element = items[i];
        a = element.getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            element.style.display = "block"
            if (firstVisible === null) {
                firstVisible = element;
            }
            if (element.classList.contains("active"))
                active = element;
        } else {
            element.classList.remove("active")
            element.style.display = "none"
        }
    }
    if (active === null && firstVisible !== null) {
        active = firstVisible
    }
    if (active !== null) {
        active.scrollIntoView({behavior: "auto", block: "nearest", inline: "start"});
        active.classList.add("active")
    }
}

document.addEventListener('keyup', event => {
    if (event.isComposing) return; // do not filter before IME finishes
    filterItems();
})

function startListening() {
    list.addEventListener('click', function (e) {
        const target = <HTMLElement>e.target;
        const id = String(target.getAttribute('data-id'));
        parent.postMessage({pluginMessage: {type: 'navigate', id: id, filter: search.value}}, '*')
    })
}