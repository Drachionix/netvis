import assert from "node:assert/strict"
import test from "node:test"
import { parseObjects } from "./local-objects.js"

const topology = () => ({
    router: {
        "router:edge": {
            id: "router:edge",
            type: "router:managed",
            neighbors: [{ id: "network:lan", neighbor_count: 1, is_tunnel: true }]
        }
    },
    network: {
        "network:lan": {
            id: "network:lan",
            type: "network",
            address: "192.0.2.0/24",
            address2: "2001:db8::/64",
            neighbors: null,
            hosts: null
        }
    }
})

test("indexes exported objects and normalizes null lists without changing metadata", () => {
    const data = topology()
    const objects = parseObjects(JSON.stringify(data))
    assert.equal(objects.size, 2)
    assert.deepEqual(objects.get("router:edge"), { ...data.router["router:edge"], hosts: [] })
    assert.deepEqual(objects.get("network:lan"), {
        ...data.network["network:lan"], neighbors: [], hosts: []
    })
})

test("accepts an empty category and missing optional lists", () => {
    const data = topology()
    data.network = {}
    delete data.router["router:edge"].neighbors
    assert.deepEqual(parseObjects(JSON.stringify(data)).get("router:edge").neighbors, [])
})

test("rejects malformed JSON, graph exports, missing maps, and empty topologies", () => {
    for (const text of ["{", "null", "[]", '{"router":{}}', '{"router":{},"network":{}}']) {
        assert.throws(() => parseObjects(text))
    }
})

test("rejects malformed objects and lists with an actionable object ID", () => {
    for (const patch of [
        { id: "router:other" },
        { type: "network" },
        { neighbors: {} },
        { neighbors: [null] },
        { neighbors: [{ id: 42 }] },
        { neighbors: [{ id: "network:lan", neighbor_count: "one" }] },
        { neighbors: [{ id: "network:lan", is_tunnel: "true" }] },
        { hosts: [42] },
        { address: {} }
    ]) {
        const data = topology()
        Object.assign(data.router["router:edge"], patch)
        assert.throws(() => parseObjects(JSON.stringify(data)), /router:edge/)
    }
})
