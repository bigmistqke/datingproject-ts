import uniqid from 'uniqid';
import Emitter from '../Emitter'

function BlockManager({ script_id, getBlocks, getInstructions, updateInstructions, getRoles, updateBlocks, setConnecting, setOverlay }) {
    let _ext = { getBlocks, updateBlocks, getRoles, getInstructions, updateInstructions, setConnecting, script_id, setOverlay }

    const _connection = new ConnectionManager(this);
    _connection.addEventListener('update', (e) => { this.updateConnection(e.detail.block, e.detail.role_id, e.detail.direction, e.detail.data) })
    _connection.addEventListener('start', (e) => { _ext.setConnecting(true) })
    _connection.addEventListener('end', (e) => { _ext.setConnecting(false) })
    _connection.addEventListener('add', (e) => { this.updateConnectionById(e.detail.block_id, e.detail.role_id, e.detail.direction, e.detail.data) })

    const _position = new PositionManager();
    _position.addEventListener('update', (e) => { updateBlock(e.detail.block_id, { position: e.detail.position }) })
    _position.addEventListener('add', (e) => { updateBlock(e.detail.block_id, { position: e.detail.position }) })

    this.startPosition = (e, block) => {
        console.log('start');
        _position.start(e, block);
    }

    this.startConnection = (block, role_id, direction) => {
        _connection.start(block, role_id, direction);
    }

    this.add = (position) => {
        let t_blocks = _ext.getBlocks();
        let newBlock = getDefaultBlock();
        newBlock.position = position;
        t_blocks.push(newBlock);
        _ext.updateBlocks(t_blocks);
    }



    const remove = (block) => {
        let t_blocks = _ext.getBlocks();
        block.connections.forEach(c => {
            if (c.prev_block_id) {
                this.removeConnection(c.prev_block_id, c.role_id, 'next');
            }
            if (c.next_block_id) {
                this.removeConnection(c.next_block_id, c.role_id, 'prev');
            }
        })
        t_blocks = t_blocks.filter(v => v.block_id !== block.block_id);
        _ext.updateBlocks(t_blocks);
    }

    const confirmDelete = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let result = await this.openOverlay({ type: 'confirm', data: { text: 'delete this block', position: { x: e.clientX, y: e.clientY } } });
        _ext.setOverlay(false);
        if (!result) return;
        remove(block);
    }

    const openOverlay = async ({ type, data }) => {
        return new Promise((resolve) => {
            _ext.setOverlay({ type, data, resolve });
        })
    }

    const openRoleOverlay = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let roles = _ext.getRoles().filter(r_role => !block.connections.find(connection => connection.role_id === r_role.role_id));
        let result = await this.openOverlay({ type: 'role', data: { block: block, roles: roles, position: { x: e.clientX, y: e.clientY } } });
        _ext.setOverlay(false);
        if (!result) return;
        addRoleToConnections({ block: block, role_id: result });
    }

    const addDefaultInstruction = (block_id, role_id) => {
        let new_instr = this.getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        let t_instructions = _ext.getInstructions();
        t_instructions[instruction_id] = new_instr;
        _ext.updateInstructions(t_instructions);

        let t_blocks = _ext.getBlocks();

        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        b_instr.push(instruction_id);
        _ext.updateBlocks(t_blocks);
    }

    const addRoleToConnections = ({ block, role_id }) => {
        let t_blocks = _ext.getBlocks();
        if (block.connections.length === 0) {
            this.addDefaultInstruction(block.block_id, role_id)
        }
        block.connections.push({ role_id: role_id, block_id: block.block_id, script_id: _ext.script_id, prev_block_id: null, next_block_id: null });
        block.connections.sort(function (a, b) { return a.role_id > b.role_id });
        _ext.updateBlocks(t_blocks);
        _ext.setOverlay(false);

    }

    const removeConnection = (connecting_id, role_id, direction) => {
        let t_blocks = _ext.getBlocks();
        console.log('t_blocks', t_blocks, connecting_id);
        let connection = t_blocks.find((v) => { return v.block_id === connecting_id })
            .connections.find(v => { return v.role_id === role_id });
        if (!connection) return;
        connection[`${direction}_block_id`] = null;
    }

    const updateConnectionById = (block_id, role_id, direction, data) => {
        console.log(block_id);
        let block = _ext.getBlocks().find(v => { return v.block_id === block_id });
        this.updateConnection(block, role_id, direction, data);
    }



    const updateConnection = async (block, role_id, direction, data) => {
        let t_blocks = _ext.getBlocks();
        console.log(block, role_id, direction, data);
        let startConnection = block.connections.find(v => { return v.role_id === role_id });

        if (!startConnection) {
            let result = await this.openOverlay({ type: 'confirm', data: { text: 'add role to block' } });
            _ext.setOverlay(false);
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
        _ext.updateBlocks(t_blocks);
    }

    const updateBlock = (block_id, data) => {
        let t_blocks = _ext.getBlocks();
        Object.keys(data).forEach((key) => {
            let t_block = t_blocks.find(v => v.block_id === block_id);
            if (!t_block) return;
            t_block[key] = data[key];
        })
        console.log('moooooooooove', block_id, data);

        _ext.updateBlocks(t_blocks);
    }
    const getDefaultBlock = () => { let block_id = uniqid(); return { block_id: block_id, instructions: [], connections: [] } };
}

function ConnectionManager(blockManager) {
    Emitter.call(this);
    let _updating = {
        block: '',
        role_id: '',
        direction: ''
    }

    this.start = (block, role_id, direction) => {
        _updating = {
            block: block,
            role_id: role_id,
            direction: direction === 'in' ? 'prev' : 'next'
        }
        dispatch('start');
        document.body.addEventListener("pointermove", this.move);
        document.body.addEventListener("pointerup", this.end);
    }

    const dispatch = (type, data = null) => {
        let event = new CustomEvent(type, { detail: data });
        dispatchEvent(event);
    }

    const dispatchUpdate = (block, direction, data) => {
        dispatch('update', { block: block, role_id: _updating.role_id, direction: direction, data: data });
    }

    const dispatchAdd = (block_id, direction, data) => {
        dispatch('add', { block_id: block_id, role_id: _updating.role_id, direction: direction, data: data });
    }


    const move = (e) => {
        dispatchUpdate(_updating.block, _updating.direction, { x: e.clientX, y: e.clientY });
    }

    const end = async (e) => {

        document.body.removeEventListener("pointermove", this.move);
        document.body.removeEventListener("pointerup", this.end);

        dispatch('end');

        if (e.target.classList.contains("block")) {
            let this_id = _updating.block.block_id;
            let connecting_id = e.target.id.replace('block_', '');

            if (this_id !== connecting_id) {
                dispatchUpdate(_updating.block, _updating.direction, connecting_id);
                dispatchAdd(connecting_id, (_updating.direction === 'next' ? 'prev' : 'next'), this_id);
            } else {
                dispatchUpdate(_updating.block, _updating.direction, null);
            }
        } else {
            dispatchUpdate(_updating.block, _updating.direction, null);
        }
    }


}






class PositionManager extends EventTarget {
    constructor() {
        super();
        this.coords = {};
        this.block = '';
        this.position = {};
        this.lastTick = performance.now();
    }

    start = (e, block) => {
        if (!e.target.classList.contains("block")) return;
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
        if (performance.now() - this.lastTick < 1000 / 60) return;
        this.lastTick = performance.now();
        const coords_delta = {
            x: (this.coords.x - e.clientX) * -1,
            y: (this.coords.y - e.clientY) * -1
        };

        this.position = {
            x: this.position.x + coords_delta.x,
            y: this.position.y + coords_delta.y
        };
        const event = new CustomEvent('update', { detail: { block_id: this.block.block_id, position: this.position } });

        dispatchEvent(event);
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