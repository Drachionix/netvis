import assert from "node:assert/strict"
import test from "node:test"
import Cytoscape from "cytoscape"
import Controller from "./controller.js"
import undoRedo from "./cytoscape-undo-redo.js"
import { parseObjects } from "./local-objects.js"

Cytoscape.use(undoRedo)

function setup(t, local = true) {
    const cy = new Cytoscape({ headless: true, layout: { name: "preset" } })
    const localObjects = parseObjects(JSON.stringify({
        router: {
            "router:edge": {
                id: "router:edge", type: "router:managed",
                neighbors: [
                    { id: "network:lan", neighbor_count: 1, is_tunnel: true },
                    { id: "interface:edge.lan", neighbor_count: 1 }
                ]
            }
        },
        network: {
            "network:lan": {
                id: "network:lan", type: "network",
                neighbors: [{ id: "router:edge", neighbor_count: 2 }],
                hosts: ["host:client"], address: "192.0.2.0/24", address2: "2001:db8::/64"
            }
        }
    }))
    const controller = new Controller({ cy, localObjects: local ? localObjects : null })
    controller.options.autolayout = false
    t.after(() => cy.destroy())
    return { cy, controller, localObjects }
}

test("local loading, neighbors, tunnel edges and undo/redo never fetch", async t => {
    t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected backend request") })
    const { cy, controller } = setup(t)
    await controller.showSingleNode("router:edge", false)
    assert.equal(cy.nodes().length, 1)
    assert.equal(await controller.showNode(cy.nodes()[0].data("neighbors"), false), true)
    assert.equal(cy.nodes().length, 2)
    assert.equal(cy.edges().length, 1)
    assert.deepEqual(cy.getElementById("network:lan").data("hosts"), ["host:client"])
    controller.undo()
    assert.equal(cy.nodes().length, 1)
    controller.redo()
    assert.equal(cy.nodes().length, 2)
    assert.equal(fetch.mock.callCount(), 0)
})

test("single-node neighbor loading preserves tunnel metadata", async t => {
    const { cy, controller } = setup(t)
    await controller.showSingleNode("network:lan", false)
    await controller.showSingleNode("router:edge", false)
    assert.equal(cy.edges().length, 2)
    assert.ok(cy.edges().every(edge => edge.data("is_tunnel")))
})

test("local lookups return independent data including both address families", async t => {
    const { controller, localObjects } = setup(t)
    const node = await controller.getNodeData("network:lan", true)
    assert.equal(node.address2, "2001:db8::/64")
    node.hosts.push("host:new")
    node.neighbors.reverse()
    assert.deepEqual(localObjects.get("network:lan").hosts, ["host:client"])
    assert.notEqual(node, await controller.getNodeData("network:lan", false))
})

test("missing local objects report errors without falling back to the backend", async t => {
    t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected backend request") })
    const { controller, cy } = setup(t)
    const errors = []
    controller.bus.on("showErr", err => errors.push(err.message))
    await controller.showSingleNode("router:missing", false)
    assert.equal(await controller.showNode([{ id: "network:missing" }], false), false)
    assert.equal(errors.length, 2)
    assert.match(errors[0], /router:missing/)
    assert.match(errors[1], /network:missing/)
    assert.equal(cy.nodes().length, 0)
    assert.equal(fetch.mock.callCount(), 0)
})

test("local mode blocks path requests at the controller boundary", async t => {
    t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected backend request") })
    const { controller } = setup(t)
    const path = { source: "router:edge", destination: "network:lan" }
    await assert.rejects(controller.getPathFromBackend(path), /Pfadanzeige/)
    const errors = []
    controller.bus.on("showErr", err => errors.push(err.message))
    await controller.showPath(path)
    assert.equal(errors.length, 1)
    assert.equal(fetch.mock.callCount(), 0)
})

test("restoring a graph resolves node details and edges from the local topology", async t => {
    t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected backend request") })
    const { cy, controller } = setup(t)
    await controller.addNodesFromArray([
        { data: { id: "router:edge" }, position: { x: 10, y: 20 } },
        { data: { id: "network:lan" }, position: { x: 100, y: 200 } }
    ])
    assert.equal(cy.nodes().length, 2)
    assert.equal(cy.getElementById("router:edge").data("type"), "router:managed")
    assert.deepEqual(cy.getElementById("network:lan").position(), { x: 100, y: 200 })
    assert.equal(cy.edges().length, 2)
    assert.equal(fetch.mock.callCount(), 0)
})

test("without local objects, object and path requests still use the backend", async t => {
    const object = { id: "router:backend", type: "router", neighbors: [] }
    t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => object }))
    const { controller } = setup(t, false)
    assert.deepEqual(await controller.getNodeData("router:backend", true), object)
    await controller.getPathFromBackend({ source: "router:a", destination: "router:b" })
    assert.equal(fetch.mock.calls[0].arguments[0], "backend/get?id=router:backend&v6=true")
    assert.equal(fetch.mock.calls[1].arguments[0], "backend/path?source=router:a&destination=router:b")
})

test("backend path display loads its objects and applies layout", async t => {
    t.mock.method(globalThis, "fetch", async url => ({
        ok: true,
        json: async () => url.startsWith("backend/path")
            ? ["router:backend"]
            : { id: "router:backend", type: "router", neighbors: [] }
    }))
    const { controller, cy } = setup(t, false)
    t.mock.method(controller, "runLayout", () => {})
    await controller.showPath({ source: "router:a", destination: "router:b" })
    assert.equal(cy.nodes()[0].id(), "router:backend")
    assert.equal(controller.runLayout.mock.callCount(), 1)
    assert.equal(controller.options.autolayout, false)
})
