function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function parseObjects(text) {
    return objectsFromData(JSON.parse(text))
}

export function parseJsonFile(text) {
    const data = JSON.parse(text)
    if ( Array.isArray(data) ) {
        if ( data.some(n => !isRecord(n) || !isRecord(n.data) || typeof n.data.id !== "string") ) {
            throw new Error("Es wird ein gespeicherter netvis-Graph mit gültigen Knoten-IDs erwartet.")
        }
        return { graph: data }
    }
    return { objects: objectsFromData(data) }
}

function objectsFromData(data) {
    if ( !isRecord(data) || !isRecord(data.network) || !isRecord(data.router) ) {
        throw new Error('Die Datei muss eine von Netspoc exportierte Topologie enthalten.')
    }

    const objects = new Map()
    for (const type of ["network", "router"]) {
        for (const [id, object] of Object.entries(data[type])) {
            if ( !isRecord(object) || !id.startsWith(type + ":") ||
                object.id !== id || typeof object.type !== "string" ||
                (object.type !== type && !object.type.startsWith(type + ":")) ) {
                throw new Error(`Ungültiges Objekt ${id}`)
            }
            const neighbors = object.neighbors ?? []
            const hosts = object.hosts ?? []
            if ( !Array.isArray(neighbors) || neighbors.some(n =>
                    !isRecord(n) || typeof n.id !== "string" ||
                    (n.neighbor_count !== undefined && !Number.isFinite(n.neighbor_count)) ||
                    (n.is_tunnel !== undefined && typeof n.is_tunnel !== "boolean")
                ) || !Array.isArray(hosts) || hosts.some(h => typeof h !== "string") ||
                ["address", "address2", "in_area"].some(key =>
                    object[key] != null && typeof object[key] !== "string"
                ) ) {
                throw new Error(`Ungültige Objektdaten des Objektes ${id}`)
            }
            objects.set(id, { ...object, neighbors, hosts })
        }
    }
    if ( objects.size === 0 ) {
        throw new Error("Die Datei enthält keine Objekte.")
    }
    return objects
}
