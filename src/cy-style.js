let style = [
    {
        selector: 'core',
        style: {
            'active-bg-color': '#fff',
            'active-bg-opacity': '0.333',
        }
    },
    {
        selector: 'node',
        style: {
            'text-valign': 'center',
            'text-halign': 'center',
            'width': function (ele) {
                return ele.data("id").length * 10
            },
            'height': 49,
            'background-opacity': '0.5',
            'label': 'data(id)',
        },
    },
    {
        selector: 'node[type = "network"]',
        style: {
            'shape': 'round-rectangle',
            'background-color': 'blue',
        }
    },
    {
        selector: 'node[type = "router"]',
        style: {
            'background-color': '#808080',
            'shape': 'ellipse',
            'height': 80,

        }
    },
    {
        selector: 'node[type*="router:"]',
        style: {
            'background-color': 'crimson',
            'shape': 'ellipse',
            'height': 80,

        }
    },
    {
        selector: 'node[type= "area"]',
        style: {
            'background-color': 'green',
            'shape': 'cut-rectangle',
            'height': 80,

        }
    },
    {
        selector: ':parent',
        style: {
            'background-color': '#5a5a5a',
            'content': '',

        }
    },
    {
        selector: ':selected',
        style: {
            // 'background-color': '#ff4212',
            "border-width": "5px",
            // "border-color": "#ff4112",
            "border-color": "#000",
            "border-opacity": "0.25",
            // "border-offset": "5em",
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 3,
            'line-color': '#ccc',
            'curve-style': 'straight',
            // 'line-style': 'dashed',
            // 'line-dash-pattern': ['12', '6'],
            // 'target-arrow-shape': 'triangle',
            // 'target-arrow-width': '100em',
            'arrow-scale': '2',
            // 'target-endpoint': 'outside-to-node-or-label',
        }
    },
    {
        selector: 'edge[is_tunnel]',
        style: {
            'curve-style': 'bezier',
        }
    }
]

export default style
export { style }