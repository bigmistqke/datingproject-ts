import uniqid from 'uniqid';
import Emitter from "../helpers/Emitter.js"
// import BlockPositionManager from "./BlockPositionManager"
// import BlockConnectionManager from "./BlockConnectionManager"


function BlockManager({ _get, _set, script_id, visualizeErrors, openOverlay }) {
    // SETUP CONNECTION MANAGER
    const ConnectionManager = function () {
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
            // dispatch('start');
            _set.connecting(true)

            document.body.addEventListener("pointermove", move);
            document.body.addEventListener("pointerup", end);
        }

        const move = (e) => {
            updateConnection(_updating.block, _updating.role_id, _updating.direction, { x: e.clientX, y: e.clientY })
        }

        const end = async (e) => {
            let this_id = _updating.block.block_id;

            document.body.removeEventListener("pointermove", move);
            document.body.removeEventListener("pointerup", end);

            // dispatch('end');
            console.log(e.target);

            _set.connecting(false);
            setTimeout(() => {
                visualizeErrors();
            }, 125)

            if (e.target.classList.contains("block")) {
                let connecting_id = e.target.id.replace('block_', '');

                if (this_id !== connecting_id) {
                    updateConnection(_updating.block, _updating.role_id, _updating.direction, connecting_id);
                    let block = _get.blocks().find(v => v.block_id === connecting_id);
                    updateConnection(block, _updating.role_id, (_updating.direction === 'next' ? 'prev' : 'next'), _updating.block.block_id);


                    console.log('this should happen!!!!');
                    setTimeout(visualizeErrors, 250)
                    setTimeout(visualizeErrors, 500)
                } else {
                    updateConnection(_updating.block, _updating.role_id, _updating.direction, null)
                }
            } else {
                updateConnection(_updating.block, _updating.role_id, _updating.direction, null)

            }
        }

    }

    // SET UP POSITIONMANAGER

    function PositionManager() {
        let coords = {};
        let block = '';
        let position = {};
        let lastTick = performance.now();
        let invertedZoom = 1;

        this.start = (e, _block, _zoom) => {
            if (!e.target.classList.contains("block")) return;
            block = _block;

            console.log(_zoom);
            invertedZoom = 1 / _zoom;

            coords = { x: e.clientX, y: e.clientY };
            position = block.position;
            //console.log('move start');

            document.body.addEventListener("pointermove", move);
            document.body.addEventListener("pointerup", end);
            try {
                document.body.setPointerCapture(e.pointerId);
            } catch (e) {
                console.error('no setPointerCapture');
            }
            e.preventDefault();
            e.stopPropagation();
        }

        const move = (e) => {
            //console.log('move');
            if (performance.now() - lastTick < 1000 / 60) return;
            lastTick = performance.now();
            const coords_delta = {
                x: (coords.x - e.clientX) * -1 * invertedZoom,
                y: (coords.y - e.clientY) * -1 * invertedZoom
            };

            position = {
                x: position.x + coords_delta.x,
                y: position.y + coords_delta.y
            };
            // const event = new CustomEvent('update', { detail: { block_id: block.block_id, position: position } });

            // this.dispatchEvent(event);
            updateBlock(block.block_id, { position: position })
            coords = { x: e.clientX, y: e.clientY };
        }
        const end = (e) => {
            document.body.removeEventListener("pointermove", move);
            document.body.removeEventListener("pointerup", end);
            try {
                document.body.releasePointerCapture(e.pointerId);
            } catch (e) {
                console.error('no releasePointerCapture');
            }
        }
    }

    const _position = new PositionManager();
    const _connection = new ConnectionManager();

    this.startPosition = (e, block, zoom) => {
        _position.start(e, block, zoom);
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
        console.log('eeeeeeeeeeeeeee', _get.roles());

        let roles = _get.roles().filter(r_role => {
            let foundRole = block.connections.find(connection => {
                console.log(connection.role_id, r_role, connection.role_id === r_role);
                return connection.role_id === r_role
            })
            console.log('did i find the role? ', foundRole);
            return !foundRole;
        });
        if (roles.length === 0) return;
        console.log('openROleOverlay ', roles);
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
        // remove all instructions that are a part of block
        let t_instructions = _get.instructions();
        block.instructions.forEach(instruction => {
            delete t_instructions[instruction];
        })
        _set.instructions(t_instructions);

        // remove block
        let t_blocks = _get.blocks();

        block.connections.forEach(c => removeConnections(c))
        t_blocks = t_blocks.filter(v => v.block_id !== block.block_id);
        _set.blocks(t_blocks);

    }

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
        block.connections = [...block.connections, {
            role_id: role_id,
            block_id: block.block_id,
            script_id: script_id,
            prev_block_id: null,
            next_block_id: null
        }]
        block.connections.sort((a, b) => a.role_id > b.role_id);
        _set.blocks(t_blocks);
    }

    const removeConnection = (connecting_id, role_id, direction) => {
        let t_blocks = _get.blocks();
        let connection = t_blocks.find((v) => v.block_id === connecting_id)
            .connections.find(v => v.role_id === role_id);
        if (!connection) return;
        connection[`${direction}_block_id`] = null;
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
        // let now = performance.now();

        let t_blocks = _get.blocks();
        // console.log(t_blocks);

        let t_block = t_blocks.find(v => v.block_id === block_id);

        if (!t_block) return;
        Object.keys(data).forEach((key) => {
            t_block[key] = data[key];
        })
        _set.blocks(t_blocks);
        // console.log('delta', performance.now() - now);

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