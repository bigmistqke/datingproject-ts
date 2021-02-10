import uniqid from 'uniqid';

class NodeManager {
    constructor({ script_id, getNodes, getRoles, updateNodes, setConnecting, setOverlay }) {
        this.ext = { getNodes, updateNodes, getRoles, setConnecting, script_id, setOverlay }
        this.connectingNode = '';

        this.connecting = new ConnectionManager(this);
        this.connecting.addEventListener('update', (e) => { this.updateConnection(e.detail.node, e.detail.role_id, e.detail.direction, e.detail.data) })
        this.connecting.addEventListener('start', (e) => { this.ext.setConnecting(true) })
        this.connecting.addEventListener('end', (e) => { this.ext.setConnecting(false) })
        this.connecting.addEventListener('add', (e) => { this.updateConnectionById(e.detail.node_id, e.detail.role_id, e.detail.direction, e.detail.data) })

        this.positioning = new PositionManager();
        this.positioning.addEventListener('update', (e) => { this.updateNode(e.detail.node_id, { position: e.detail.position }) })

        this.roleManager = new RoleManager();
        this.positioning.addEventListener('add', (e) => { this.updateNode(e.detail.node_id, { position: e.detail.position }) })
    }


    add(position) {
        let t_nodes = this.ext.getNodes();
        let newNode = this.getDefaultNode();
        newNode.position = position;
        t_nodes.push(newNode);
        this.ext.updateNodes(t_nodes);
    }
    delete(node) {
        console.log(node);
        // remove all references in other nodes' connections
        let t_nodes = this.ext.getNodes();
        node.connections.forEach(c => {
            if (c.prev_node_id) {
                this.removeConnection(c.prev_node_id, c.role_id, 'next');
            }
            if (c.next_node_id) {
                this.removeConnection(c.next_node_id, c.role_id, 'prev');
            }
        })
        t_nodes = t_nodes.filter(v => v.node_id !== node.node_id);
        this.ext.updateNodes(t_nodes);
    }

    confirmDelete = async (e, node) => {
        e.preventDefault();
        e.stopPropagation();

        console.log({ text: 'delete this node', position: { x: e.clientX, y: e.clientY } });
        let result = await this.openOverlay({ type: 'confirm', data: { text: 'delete this node', position: { x: e.clientX, y: e.clientY } } });
        this.ext.setOverlay(false);
        if (!result) return;
        this.delete(node);
    }

    openOverlay = async ({ type, data }) => {
        return new Promise((resolve) => {
            this.ext.setOverlay({ type, data, resolve });
        })
    }

    openRoleOverlay = async (e, node) => {
        e.preventDefault();
        e.stopPropagation();

        let roles = this.ext.getRoles().filter(r_role => !node.connections.find(connection => connection.role_id === r_role.role_id));
        let result = await this.openOverlay({ type: 'role', data: { node: node, roles: roles, position: { x: e.clientX, y: e.clientY } } });
        this.ext.setOverlay(false);
        if (!result) return;
        console.log(result);
        this.addRoleToConnections({ node: node, role_id: result });
        console.log(result);
    }

    addRoleToConnections({ node, role_id }) {
        let t_nodes = this.ext.getNodes();
        if (node.connections.length === 0)
            node.instructions.push(this.getDefaultInstruction(node.node_id, role_id));
        node.connections.push({ role_id: role_id, node_id: node.node_id, script_id: this.ext.script_id, prev_node_id: null, next_node_id: null });
        node.connections.sort(function (a, b) { return a.role_id > b.role_id });
        this.ext.updateNodes(t_nodes);
        this.ext.setOverlay(false);

    }

    removeConnection = (connecting_id, role_id, direction) => {
        let t_nodes = this.ext.getNodes();
        console.log('t_nodes', t_nodes, connecting_id);
        t_nodes.find((v) => { return v.node_id === connecting_id })
            .connections.find(v => { return v.role_id === role_id })[`${direction}_node_id`] = null;
    }

    updateConnectionById = (node_id, role_id, direction, data) => {
        console.log(node_id);
        let node = this.ext.getNodes().find(v => { return v.node_id === node_id });
        this.updateConnection(node, role_id, direction, data);
    }



    updateConnection = async (node, role_id, direction, data) => {
        let t_nodes = this.ext.getNodes();
        console.log(node, role_id, direction, data);
        let startConnection = node.connections.find(v => { return v.role_id === role_id });

        if (!startConnection) {
            let result = await this.openOverlay({ type: 'confirm', data: { text: 'add role to node' } });
            this.ext.setOverlay(false);
            if (!result) return;
            this.addRoleToConnections({ node: node, role_id: role_id });
            startConnection = node.connections.find(v => { return v.role_id === role_id });
        }

        let prev_data = startConnection[`${direction}_node_id`];

        if (typeof prev_data !== 'object') {
            console.log('this happens');
            let _direction = direction === 'next' ? 'prev' : 'next';
            let connecting_id = prev_data;
            this.removeConnection(connecting_id, role_id, _direction);
        }

        startConnection[`${direction}_node_id`] = data;
        this.ext.updateNodes(t_nodes);
    }

    updateNode(node_id, data) {
        let t_nodes = this.ext.getNodes();
        Object.keys(data).forEach((key) => {
            let t_node = t_nodes.find(v => v.node_id === node_id);
            if (!t_node) return;
            t_node[key] = data[key];
        })
        this.ext.updateNodes(t_nodes);
    }





    getDefaultInstruction = (node_id, role_id) => {
        return { instruction_id: uniqid(), node_id: node_id, script_id: parseInt(this.ext.script_id), role_id: role_id, type: "say", text: "" }
    }

    addConnectionToNode = (role_id, node_id) => {
        let t_nodes = this.ext.getNodes();
        let node = t_nodes.find(v => v.node_id === node_id);

        if (node.connections.length === 0)
            node.instructions.push(this.getDefaultInstruction(node.node_id, role_id));

        node.connections.push({ role_id: role_id, node_id: node_id, script_id: this.ext.script_id, prev_node_id: null, next_node_id: null });
        node.connections.sort(function (a, b) { return a.role_id > b.role_id });

        this.ext.updateNodes(t_nodes);
        this.ext.setShowOverlay(false);
    }


    getDefaultNode = () => { let node_id = uniqid(); return { node_id: node_id, instructions: [], connections: [] } };
}

class ConnectionManager extends EventTarget {
    constructor(nodeManager) {
        super();
        this.nodeManager = nodeManager;
        this.updating = {
            node: '',
            role_id: '',
            direction: ''
        }
    }

    dispatch = (type, data = null) => {
        let event = new CustomEvent(type, { detail: data });
        this.dispatchEvent(event);
    }

    dispatchUpdate = (node, direction, data) => {
        this.dispatch('update', { node: node, role_id: this.updating.role_id, direction: direction, data: data });
    }

    dispatchAdd = (node_id, direction, data) => {
        this.dispatch('add', { node_id: node_id, role_id: this.updating.role_id, direction: direction, data: data });
    }


    move = (e) => {
        this.dispatchUpdate(this.updating.node, this.updating.direction, { x: e.clientX, y: e.clientY });
    }

    end = async (e) => {
        console.log('this???');

        document.body.removeEventListener("pointermove", this.move);
        document.body.removeEventListener("pointerup", this.end);

        this.dispatch('end');

        if (e.target.classList.contains("node")) {
            let this_id = this.updating.node.node_id;
            let connecting_id = e.target.id.replace('node_', '');


            if (this_id !== connecting_id) {
                this.dispatchUpdate(this.updating.node, this.updating.direction, connecting_id);
                this.dispatchAdd(connecting_id, (this.updating.direction === 'next' ? 'prev' : 'next'), this_id);
            } else {
                this.dispatchUpdate(this.updating.node, this.updating.direction, null);
            }
        } else {
            this.dispatchUpdate(this.updating.node, this.updating.direction, null);
        }
    }

    start = (node, role_id, direction) => {
        this.updating = {
            node: node,
            role_id: role_id,
            direction: direction === 'in' ? 'prev' : 'next'
        }
        this.dispatch('start');
        document.body.addEventListener("pointermove", this.move);
        document.body.addEventListener("pointerup", this.end);
    }
}

class PositionManager extends EventTarget {
    constructor() {
        super();
        this.coords = {};
        this.node = '';
        this.position = {};
    }

    start = (e, node) => {
        if (!e.target.classList.contains("node")) return;

        this.node = node;
        this.coords = { x: e.clientX, y: e.clientY };
        this.position = node.position;
        document.body.addEventListener("pointermove", this.move);
        document.body.addEventListener("pointerup", this.end);
        try {
            document.body.setPointerCapture(e.pointerId);
        } catch (e) {
            console.log('no setPointerCapture');
        }
        e.preventDefault();
        e.stopPropagation();
    }

    move = (e) => {
        let coords_delta = {
            x: (this.coords.x - e.clientX) * -1,
            y: (this.coords.y - e.clientY) * -1
        };

        this.position = {
            x: this.position.x + coords_delta.x,
            y: this.position.y + coords_delta.y
        };
        let event = new CustomEvent('update', { detail: { node_id: this.node.node_id, position: this.position } });
        this.dispatchEvent(event);
        this.coords = { x: e.clientX, y: e.clientY };
    }
    end = (e) => {
        document.body.removeEventListener("pointermove", this.move);
        document.body.removeEventListener("pointerup", this.end);
        try {
            document.body.releasePointerCapture(e.pointerId);
        } catch (e) {
            console.log('no releasePointerCapture');
        }
    }
}

class RoleManager extends EventTarget {

}



export default NodeManager;