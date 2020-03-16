import './ui.css'

const list = document.getElementById("list")
const caption = document.getElementById("caption")

onmessage = (event) => {
    const pluginMessage = event.data.pluginMessage

    switch (pluginMessage.command) {
        case "goto-page":
            caption.innerText = "Go to Page"
            break;
        case "goto-frame":
            caption.innerText = "Go to Frame"
            break;
        default:
            caption.innerText = "Unrecognized command!"
            break;
    }

    if (pluginMessage.type == 'load') {
        document.getElementById("loader").remove()
        pluginMessage.items.forEach((page: any, index: number) => {
            const activeness = index === 0 ? "active" : "";
            let newItem = `<li data-id="${(page.id)}" class="${activeness}"><a href="#"><div class="name">${(page.name)} </div></a></li>`
            list.innerHTML += newItem;
        })

        setTimeout(() => startListening(), 100)
    }
}

document.getElementById("search").focus()

document.addEventListener('keydown', event => {
    if (event.isComposing) return; // do not filter before IME finishes

    const items = list.getElementsByTagName("li");

    let active = null;
    let handled = false;

    switch (event.code) {
        case "Escape":
            parent.postMessage({pluginMessage: {type: 'cancel'}}, '*')
            return;
        case "ArrowDown": {
            let first = null;
            for (let i = 0; i < items.length; i++) {
                let element = items[i];
                if (element.classList.contains("hidden"))
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
                if (element.classList.contains("hidden"))
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
            for (let i = 0; i < items.length; i++) {
                let element = items[i];
                if (element.classList.contains("active")) {
                    const id = element.attributes.getNamedItem("data-id").value;
                    parent.postMessage({pluginMessage: {type: 'navigate', id: id}}, '*')
                }
            }
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

document.addEventListener('keyup', event => {
    if (event.isComposing) return; // do not filter before IME finishes
    const items = list.getElementsByTagName("li");

    const input: any = document.getElementById("search");
    const filter: any = input.value.toUpperCase();
    let active = null;
    let firstVisible = null
    let a: any, txtValue: any;
    for (let i = 0; i < items.length; i++) {
        let element = items[i];
        a = element.getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            element.classList.remove("hidden")
            if (firstVisible === null) {
                firstVisible = element;
            }
            if (element.classList.contains("active"))
                active = element;
        } else {
            element.classList.remove("active")
            element.classList.add("hidden")
        }
    }
    if (active === null && firstVisible !== null) {
        active = firstVisible
    }
    if (active !== null) {
        active.scrollIntoView({behavior: "auto", block: "nearest", inline: "start"});
        active.classList.add("active")
    }
})

function startListening() {
    list.addEventListener('click', function (e) {
        const target = <HTMLElement>e.target;
        const id = String(target.getAttribute('data-id'));
        parent.postMessage({pluginMessage: {type: 'navigate', id: id}}, '*')
    })
}