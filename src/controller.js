import EventEmitter from 'eventemitter3'
import tippy from "tippy.js"

class Controller {
    constructor({ cy }) {
        this.cy = cy
        this.bus = new EventEmitter()
        this.options = {
            autolayout: true,
            autoselect: true
        }
    }

    undo() {
        this.cy.undoRedo().undo()
    }

    redo() {
        this.cy.undoRedo().redo()
    }

    downloadSVG() {
        let url = window.URL.createObjectURL(new Blob([this.cy.svg({ 'full': 'true' })], { type: 'image/svg+xml' }))
        this.download(url)
    }

    downloadPNG() {
        let url = window.URL.createObjectURL(this.cy.png({ 'output': 'blob', 'full': 'true' }))
        this.download(url)
    }

    downloadJson() {
        const { cy } = this
        let out = []
        cy.nodes().jsons().forEach(element => {
            let o = { data: {} }
            o.data.id = element.data.id
            o.data.v6 = element.data.v6
            o.position = element.position
            out.push(o)
        })
        let url = window.URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }))
        this.download(url)
    }

    download(url) {
        let date = new Date()
        let name = "netvis-" + date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString() + "-" + date.getDate().toString() + "-"
            + date.getHours().toString() + "-" + date.getMinutes().toString() + "-" + date.getSeconds().toString()
        let a = document.createElement("a")
        a.href = url
        a.download = name
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
    }

    runLayout() {
        this.cy.undoRedo().do("layout", {
            options: { name: "cose-bilkent" }
        })
    }

    selectedLayout() {
        this.cy.undoRedo().do("layout", {
            eles: this.cy.nodes(':selected'),
            options: { name: "cose-bilkent", fit: false }
        })
    }

    selectedNeighbors() {
        if ( this.cy.elements(':selected').length === 0 ) {
            this.selectAll()
        }
        this.cy.elements(':selected').forEach(s => this.showAllNeighbors(s.data("neighbors")))
        this.cy.elements().unselect()
    }

    showAllNeighbors(neighbors) {
        if ( neighbors ) {
            let neigh = []
            neighbors.filter(n => !n.id.startsWith("area:") && this.cy.getElementById(n.id).length !== 1).forEach(n => neigh.push(n))
            this.showNode(neigh, false)
        }
    }

    selectAll() {
        this.cy.elements().select()
    }

    centerGraph() {
        this.cy.fit()
    }

    connectMissingNeighbors(node) {
        const { cy } = this
        if ( !node.data().neighbors )
            return
        node.data().neighbors.forEach((n) => {
            if ( cy.getElementById(n.id).length === 1 && node.neighborhood().getElementById(n.id).length !== 1 ) {
                let edgeCount = 1
                if ( n.is_tunnel ) edgeCount = 2
                for (let i = 0; i < edgeCount; i++) {
                    cy.add({
                        data: {
                            source: node.id(),
                            target: n.id,
                            is_tunnel: n.is_tunnel,
                        }
                    })
                }
            }
        })
    }

    showPath(path) {
        let pathNodes = this.getPathFromBackend(path)
        let nodes = []
        Promise.resolve(pathNodes).then((res) => {
            res.forEach(node => nodes.push({ id: node }))
            this.showNode(nodes.filter(n => !n.id.startsWith("network:tunnel") || !n.id.startsWith("interface:")), false)
                .then(() => {
                        this.runLayout()
                        this.cy.elements().unselect()
                    }
                )
        })
        this.options.autolayout = false
    }

    showSingleNode(name, v6) {
        let nodeCount = this.cy.elements().length
        Promise.resolve(this.addNode(name, v6)).then(() => {
            if ( nodeCount !== this.cy.elements().length && this.options.autolayout )
                this.runLayout()
        })
    }

    showNode(name, v6) {
        const { cy } = this
        let nodeCount = cy.elements().length
        let promises = []
        let nodesData = []
        name.forEach((n) => {
            if ( n.id.startsWith("interface") || n.id.startsWith("network:tunnel") ) return
            promises.push(this.getDataFromBackend(n.id, v6).then(
                node => {
                    nodesData.push({ data: node })
                }
            ))
        })

        return Promise.all(promises).then(() => {
            let addedNodes = cy.undoRedo().do("add", nodesData)
            addedNodes.forEach(node => {
                this.connectMissingNeighbors(node)
            })
            if ( nodeCount !== this.cy.elements().length && this.options.autolayout )
                this.runLayout()
            return true
        })

    }

    async addNode(name, v6) {
        if ( name.startsWith("interface") || name.startsWith("network:tunnel") ) return
        const { cy } = this
        let elements = cy.getElementById(name)
        if ( elements.length === 1 ) {
            if ( this.options.autoselect ) this.nodeSelect(elements[0])
            return
        }
        return this.getDataFromBackend(name, v6).then(
            node => {
                if ( node.type === "area" ) {
                    return
                }
                let addedNode = cy.undoRedo().do("add", { data: node })
                this.connectMissingNeighbors(addedNode.element())
                if ( this.options.autoselect ) this.nodeSelect(addedNode.element())
            }
        ).catch(
            err => {
                this.bus.emit('showErr', err)
            }
        )
    }

    async getDataFromBackend(name, v6) {
        return await fetch("backend/get?id=" + name + "&v6=" + v6).then(
            async (res) => {
                if ( !res.ok ) {
                    let text = await res.text()
                    console.log(res)
                    throw text;
                }
                return res.json()
            }
        )
    }

    async getPathFromBackend(path) {
        return await fetch("backend/path?source=" + path.source + "&destination=" + path.destination).then(
            async (res) => {
                if ( !res.ok ) {
                    let text = await res.text()
                    console.log(res)
                    throw text;
                }
                return res.json()
            }
        ).catch(
            err => {
                this.bus.emit('showErr', err)
            }
        )
    }

    updateNodeDataFromBackend() {
        const { cy } = this
        let promises = []
        cy.nodes().forEach(n => {
            promises.push(
                this.getDataFromBackend(n.id(), n.data("v6")).then(
                    result => n.data(result)
                ).catch(
                    err => {
                        this.bus.emit('showErr', err)
                        cy.remove('[id="' + n.id() + '"]')
                    }
                )
            )
        })
        Promise.all(promises).then(() => {
            cy.nodes().forEach(n => {
                this.connectMissingNeighbors(n)
            })
        })
    }

    addNodesFromArray(nodes) {
        const { cy } = this
        cy.add(nodes)
        cy.fit()
        this.updateNodeDataFromBackend()
    }

    nodeSelect(node) {
        const { cy } = this
        cy.elements().unselect()
        node.select()
        this.bus.emit('showInfo', node)
    }

    nodeUnselect(node) {
        this.bus.emit('hideInfo')
    }

    nodeCxtTap(node) {
        const { cy } = this;
        node.select()
        let selected = cy.elements(':selected')
        cy.undoRedo().do("remove", selected)
    }

    elementMouseover(element) {
        let ref = element.popperRef()
        let dummyDomEle = document.createElement('div')

        let data = ""
        if ( element.isNode() ) {
            if ( element.data("in_area") ) data = "In Area " + element.data("in_area")
            if ( element.data("address") ) data += (data ? "<br />" : "") + "IP: " + element.data("address")
            if ( element.data("address2") ) data += (data ? "<br />" : "") + "IPv6: " + element.data("address2")

            if ( element.data("type") === "network" && element.data("hosts") )
                data += (data ? "<br />" : "") + element.data("hosts").length + " Host" +
                    (element.data("hosts").length > 1 ? "s" : "")

            if ( element.data("type").startsWith("router") && element.data("neighbors") ) {
                if ( element.data("type").includes(":") )
                    data += (data ? "<br />" : "") + element.data("type")
                let interfaces = element.data("neighbors").filter(n => n.id.startsWith("interface:"))
                if ( interfaces.length > 0 )
                    data += (data ? "<br />" : "") + interfaces.length + " Interface" + (interfaces.length > 1 ? "s" : "")
            }
            if ( element.data("v6") === "true" ) data += (data ? "<br />" : "") + "v6"
        } else {
            data = element.data("is_tunnel") ? "Tunnel" : ""
        }

        if ( data ) {
            let tip = new tippy(dummyDomEle, {
                getReferenceClientRect: ref.getBoundingClientRect,
                trigger: 'manual',
                content: () => {
                    let content = document.createElement('div')
                    content.innerHTML = data
                    content.style.display = "flex"
                    content.style.textAlign = "center"
                    return content
                }
            });
            tip.show()
            element.data("popup", tip)
        }
    }

    elementMouseout(element) {
        if ( undefined !== element.data("popup") ) {
            element.data("popup").destroy()
            element.removeData("popup")
        }
    }
}

export { Controller }
export default Controller