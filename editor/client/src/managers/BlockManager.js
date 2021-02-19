import uniqid from 'uniqid';
import BlockPositionManager from "./BlockPositionManager"
import BlockConnectionManager from "./BlockConnectionManager"

function BlockManager({ _get, _set, script_id, visualizeErrors, openOverlay }) {

    const _connection = new BlockConnectionManager(this);
    _connection.addEventListener('update', (e) => {
        updateConnection(e.detail.block, e.detail.role_id, e.detail.direction, e.detail.data)
    })
    _connection.addEventListener('start', (e) => {
        _set.connecting(true)
    })
    _connection.addEventListener('end', (e) => {
        _set.connecting(false);
        setTimeout(() => {
            visualizeErrors();
        }, 125)
    })
    _connection.addEventListener('add', (e) => {
        updateConnectionById(e.detail.block_id, e.detail.role_id, e.detail.direction, e.detail.data);
        setTimeout(() => {
            visualizeErrors();
        }, 250)
        setTimeout(() => {
            visualizeErrors();
        }, 500)
    })

    _connection.addEventListener('block', ({ detail }) => {
        console.log(detail);
        this.add(detail.position);
    })

    const _position = new BlockPositionManager();
    _position.addEventListener('update', (e) => {
        updateBlock(e.detail.block_id, { position: e.detail.position })
    })
    _position.addEventListener('add', (e) => { updateBlock(e.detail.block_id, { position: e.detail.position }) })

    this.startPosition = (e, block) => {
        _position.start(e, block);
    }

    this.startConnection = (block, role_id, direction) => {
        _connection.start(block, role_id, direction);
    }

    this.add = async (position) => {
        let result = await openOverlay({ type: 'confirm', data: { text: 'add new block' } });
        //_set.overlay(false);
        if (!result) return;
        let t_blocks = _get.blocks();
        let newBlock = getDefaultBlock();
        newBlock.position = position;
        t_blocks.push(newBlock);
        _set.blocks(t_blocks);
        setTimeout(() => {
            visualizeErrors();
        }, 10)
    }

    this.confirmDelete = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let result = await openOverlay({ type: 'confirm', data: { text: 'delete this block' } });
        // //_set.overlay(false);
        if (!result) return;
        remove(block);
    }

    this.openRoleOverlay = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let roles = _get.roles().filter(r_role => !block.connections.find(connection => connection.role_id === r_role.role_id));
        let result = await openOverlay({ type: 'role', data: { block: block, roles: roles } });
        //_set.overlay(false);
        if (!result) return;
        addRoleToConnections({ block: block, role_id: result });
        setTimeout(() => {
            visualizeErrors();
        }, 10)
    }

    this.removeRole = async (e, role_id, block) => {
        let position = { x: e.clientX, y: e.clientY };
        let result = await openOverlay(
            {
                type: 'confirm',
                data: {
                    text: `remove role ${role_id} from block?`,
                    position: position
                }
            });
        //_set.overlay(false);
        if (!result) return;

        let t_blocks = _get.blocks();
        let t_block = t_blocks.find(v => v.block_id === block.block_id);

        let _connection = t_block.connections.find(v => v.role_id === role_id);
        removeConnections(_connection);
        let _connections = t_block.connections.filter(v => v.role_id !== role_id);

        if (t_block.connections.length == 0) {
            remove(t_block);
            return
        }
        let _instructions = _get.instructions();

        let hasInstructionsWithRole = t_block.instructions.find(v => _instructions[v].role_id === role_id)
        if (hasInstructionsWithRole) {
            result = await openOverlay(
                {
                    type: 'options',
                    data: {
                        text: `convert or delete instructions with role ${role_id}?`,
                        options: ['convert', 'delete']
                    }
                });
            //_set.overlay(false);
            if (!result) {
                return;
            } else if (result === 'convert') {
                let convertTo = t_block.connections[0];
                t_block.instructions.forEach(v => {
                    if (_instructions[v].role_id === role_id) {
                        _instructions[v].role_id = convertTo.role_id
                    }
                });
            } else if (result === 'delete') {
                t_block.instructions = t_block.instructions.filter(
                    v => _instructions[v].role_id !== role_id);
                if (t_block.instructions.length == 0)
                    remove(t_block);
            }
            _set.instructions(_instructions);
        }

        t_block.connections = _connections;
        _set.blocks(t_blocks);
    }

    const getDefaultInstruction = (block_id, role_id) => {
        return {
            instruction_id: uniqid(),
            block_id: block_id,
            script_id: parseInt(script_id),
            role_id: role_id,
            type: "say",
            text: ""
        }
    }

    const removeConnections = (c) => {
        if (c.prev_block_id) {
            removeConnection(c.prev_block_id, c.role_id, 'next');
        }
        if (c.next_block_id) {
            removeConnection(c.next_block_id, c.role_id, 'prev');
        }
    }

    const remove = (block) => {
        let t_blocks = _get.blocks();
        block.connections.forEach(c => removeConnections(c))
        t_blocks = t_blocks.filter(v => v.block_id !== block.block_id);
        _set.blocks(t_blocks);
    }

    /*     const openOverlay = async ({ type, data }) => {
            return new Promise((resolve) => {
                //_set.overlay({ type, data, resolve });
            })
        } */

    const addDefaultInstruction = (block_id, role_id) => {
        let new_instr = getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        let t_instructions = _get.instructions();
        t_instructions[instruction_id] = new_instr;
        _set.instructions(t_instructions);

        let t_blocks = _get.blocks();
        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        b_instr.push(instruction_id);
        _set.blocks(t_blocks);
    }

    const addRoleToConnections = ({ block, role_id }) => {
        let t_blocks = _get.blocks();
        if (block.connections.length === 0) {
            addDefaultInstruction(block.block_id, role_id)
        }
        block.connections.push(
            {
                role_id: role_id,
                block_id: block.block_id,
                script_id: script_id,
                prev_block_id: null,
                next_block_id: null
            }
        );
        block.connections.sort((a, b) => a.role_id > b.role_id);
        _set.blocks(t_blocks);
        //_set.overlay(false);
    }



    const removeConnection = (connecting_id, role_id, direction) => {
        let t_blocks = _get.blocks();
        let connection = t_blocks.find((v) => v.block_id === connecting_id)
            .connections.find(v => v.role_id === role_id);
        if (!connection) return;
        connection[`${direction}_block_id`] = null;
    }

    const updateConnectionById = (block_id, role_id, direction, data) => {
        let block = _get.blocks().find(v => v.block_id === block_id);
        updateConnection(block, role_id, direction, data);
    }

    const updateConnection = async (block, role_id, direction, data) => {
        let t_blocks = _get.blocks();
        let startConnection = block.connections.find(v => v.role_id === role_id);
        if (!startConnection) {
            let result = await openOverlay({ type: 'confirm', data: { text: 'add role to block' } });
            //_set.overlay(false);
            if (!result) return;
            addRoleToConnections({ block: block, role_id: role_id });
            startConnection = block.connections.find(v => v.role_id === role_id);
        }
        let prev_data = startConnection[`${direction}_block_id`];
        if (typeof prev_data !== 'object') {
            //console.log('this happens');
            let _direction = direction === 'next' ? 'prev' : 'next';
            let connecting_id = prev_data;
            removeConnection(connecting_id, role_id, _direction);
        }
        startConnection[`${direction}_block_id`] = data;
        _set.blocks(t_blocks);
    }

    const updateBlock = (block_id, data) => {
        let t_blocks = _get.blocks();
        let t_block = t_blocks.find(v => v.block_id === block_id);
        if (!t_block) return;
        Object.keys(data).forEach((key) => {
            t_block[key] = data[key];
        })
        _set.blocks(t_blocks);
    }
    const getDefaultBlock = () => {
        let block_id = uniqid();
        return {
            block_id: block_id,
            instructions: [],
            connections: []
        }
    };
}






export default BlockManager;