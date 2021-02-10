import uniqid from 'uniqid';

class BlockManager {
    constructor({ script_id, getBlocks, getInstructions, updateInstructions, getRoles, updateBlocks, setConnecting, setOverlay }) {
        this.ext = { getBlocks, updateBlocks, getRoles, getInstructions, updateInstructions, setConnecting, script_id, setOverlay }
        this.connectingBlock = '';

        this.connecting = new ConnectionManager(this);
        this.connecting.addEventListener('update', (e) => { this.updateConnection(e.detail.block, e.detail.role_id, e.detail.direction, e.detail.data) })
        this.connecting.addEventListener('start', (e) => { this.ext.setConnecting(true) })
        this.connecting.addEventListener('end', (e) => { this.ext.setConnecting(false) })
        this.connecting.addEventListener('add', (e) => { this.updateConnectionById(e.detail.block_id, e.detail.role_id, e.detail.direction, e.detail.data) })

        this.positioning = new PositionManager();
        this.positioning.addEventListener('update', (e) => { this.updateBlock(e.detail.block_id, { position: e.detail.position }) })

        this.roleManager = new RoleManager();
        this.positioning.addEventListener('add', (e) => { this.updateBlock(e.detail.block_id, { position: e.detail.position }) })
    }


    add(position) {
        let t_blocks = this.ext.getBlocks();
        let newBlock = this.getDefaultBlock();
        newBlock.position = position;
        t_blocks.push(newBlock);
        this.ext.updateBlocks(t_blocks);
    }
    delete(block) {
        console.log(block);
        // remove all references in other blocks' connections
        let t_blocks = this.ext.getBlocks();
        block.connections.forEach(c => {
            if (c.prev_block_id) {
                this.removeConnection(c.prev_block_id, c.role_id, 'next');
            }
            if (c.next_block_id) {
                this.removeConnection(c.next_block_id, c.role_id, 'prev');
            }
        })
        t_blocks = t_blocks.filter(v => v.block_id !== block.block_id);
        this.ext.updateBlocks(t_blocks);
    }

    confirmDelete = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        console.log({ text: 'delete this block', position: { x: e.clientX, y: e.clientY } });
        let result = await this.openOverlay({ type: 'confirm', data: { text: 'delete this block', position: { x: e.clientX, y: e.clientY } } });
        this.ext.setOverlay(false);
        if (!result) return;
        this.delete(block);
    }

    openOverlay = async ({ type, data }) => {
        return new Promise((resolve) => {
            this.ext.setOverlay({ type, data, resolve });
        })
    }

    openRoleOverlay = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let roles = this.ext.getRoles().filter(r_role => !block.connections.find(connection => connection.role_id === r_role.role_id));
        let result = await this.openOverlay({ type: 'role', data: { block: block, roles: roles, position: { x: e.clientX, y: e.clientY } } });
        this.ext.setOverlay(false);
        if (!result) return;
        console.log(result);
        this.addRoleToConnections({ block: block, role_id: result });
        console.log(result);
    }

    addDefaultInstruction(block_id, role_id) {
        let new_instr = this.getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        let t_instructions = this.ext.getInstructions();
        t_instructions[instruction_id] = new_instr;
        this.ext.updateInstructions(t_instructions);

        let t_blocks = this.ext.getBlocks();

        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        b_instr.push(instruction_id);
        this.ext.updateBlocks(t_blocks);
    }

    addRoleToConnections({ block, role_id }) {
        let t_blocks = this.ext.getBlocks();
        if (block.connections.length === 0) {
            this.addDefaultInstruction(block.block_id, role_id)
        }
        block.connections.push({ role_id: role_id, block_id: block.block_id, script_id: this.ext.script_id, prev_block_id: null, next_block_id: null });
        block.connections.sort(function (a, b) { return a.role_id > b.role_id });
        this.ext.updateBlocks(t_blocks);
        this.ext.setOverlay(false);

    }

    removeConnection = (connecting_id, role_id, direction) => {
        let t_blocks = this.ext.getBlocks();
        console.log('t_blocks', t_blocks, connecting_id);
        let connection = t_blocks.find((v) => { return v.block_id === connecting_id })
            .connections.find(v => { return v.role_id === role_id });
        if (!connection) return;
        connection[`${direction}_block_id`] = null;
    }

    updateConnectionById = (block_id, role_id, direction, data) => {
        console.log(block_id);
        let block = this.ext.getBlocks().find(v => { return v.block_id === block_id });
        this.updateConnection(block, role_id, direction, data);
    }



    updateConnection = async (block, role_id, direction, data) => {
        let t_blocks = this.ext.getBlocks();
        console.log(block, role_id, direction, data);
        let startConnection = block.connections.find(v => { return v.role_id === role_id });

        if (!startConnection) {
            let result = await this.openOverlay({ type: 'confirm', data: { text: 'add role to block' } });
            this.ext.setOverlay(false);
            if (!result) return;
            this.addRoleToConnections({ block: block, role_id: role_id });
            startConnection = block.connections.find(v => { return v.role_id === role_id });
        }

        let prev_data = startConnection[`${direction}_block_id`];

        if (typeof prev_data !== 'object') {
            console.log('this happens');
            let _direction = direction === 'next' ? 'prev' : 'next';
            let connecting_id = prev_data;
            this.removeConnection(connecting_id, role_id, _direction);
        }

        startConnection[`${direction}_block_id`] = data;
        this.ext.updateBlocks(t_blocks);
    }

    updateBlock(block_id, data) {
        let t_blocks = this.ext.getBlocks();
        Object.keys(data).forEach((key) => {
            console.log(block_id);
            let t_block = t_blocks.find(v => v.block_id === block_id);
            if (!t_block) return;
            console.log('change this dude!');
            t_block[key] = data[key];
        })
        this.ext.updateBlocks(t_blocks);
    }





    getDefaultInstruction = (block_id, role_id) => {
        return { instruction_id: uniqid(), block_id: block_id, script_id: parseInt(this.ext.script_id), role_id: role_id, type: "say", text: "" }
    }

    addConnectionToBlock = (role_id, block_id) => {
        let t_blocks = this.ext.getBlocks();
        let block = t_blocks.find(v => v.block_id === block_id);

        if (block.connections.length === 0)
            block.instructions.push(this.getDefaultInstruction(block.block_id, role_id));

        block.connections.push({ role_id: role_id, block_id: block_id, script_id: this.ext.script_id, prev_block_id: null, next_block_id: null });
        block.connections.sort(function (a, b) { return a.role_id > b.role_id });

        this.ext.updateBlocks(t_blocks);
        this.ext.setShowOverlay(false);
    }


    getDefaultBlock = () => { let block_id = uniqid(); return { block_id: block_id, instructions: [], connections: [] } };
}

class ConnectionManager extends EventTarget {
    constructor(blockManager) {
        super();
        this.blockManager = blockManager;
        this.updating = {
            block: '',
            role_id: '',
            direction: ''
        }
    }

    dispatch = (type, data = null) => {
        let event = new CustomEvent(type, { detail: data });
        this.dispatchEvent(event);
    }

    dispatchUpdate = (block, direction, data) => {
        this.dispatch('update', { block: block, role_id: this.updating.role_id, direction: direction, data: data });
    }

    dispatchAdd = (block_id, direction, data) => {
        this.dispatch('add', { block_id: block_id, role_id: this.updating.role_id, direction: direction, data: data });
    }


    move = (e) => {
        this.dispatchUpdate(this.updating.block, this.updating.direction, { x: e.clientX, y: e.clientY });
    }

    end = async (e) => {
        console.log('this???');

        document.body.removeEventListener("pointermove", this.move);
        document.body.removeEventListener("pointerup", this.end);

        this.dispatch('end');

        if (e.target.classList.contains("block")) {
            let this_id = this.updating.block.block_id;
            let connecting_id = e.target.id.replace('block_', '');
            console.log(this_id);
            console.log(connecting_id, e.target.id);

            if (this_id !== connecting_id) {
                this.dispatchUpdate(this.updating.block, this.updating.direction, connecting_id);
                this.dispatchAdd(connecting_id, (this.updating.direction === 'next' ? 'prev' : 'next'), this_id);
            } else {
                this.dispatchUpdate(this.updating.block, this.updating.direction, null);
            }
        } else {
            this.dispatchUpdate(this.updating.block, this.updating.direction, null);
        }
    }

    start = (block, role_id, direction) => {
        console.log(block);
        this.updating = {
            block: block,
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
        this.block = '';
        this.position = {};
    }

    start = (e, block) => {
        if (!e.target.classList.contains("block")) return;
        console.log(block);
        this.block = block;
        this.coords = { x: e.clientX, y: e.clientY };
        this.position = block.position;
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
        let event = new CustomEvent('update', { detail: { block_id: this.block.block_id, position: this.position } });
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



export default BlockManager;