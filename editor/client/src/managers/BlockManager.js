import uniqid from 'uniqid';
import Emitter from "../helpers/Emitter.js"


function BlockManager({ blocks, roles, instructions, connections, origin, zoom, connecting, script_id, visualizeErrors, openOverlay }) {
    let selectedBlocks = [];
    let erroredBlocks = [];

    let extendedSelectedBlocks = {};
    let duplicatedBlocks = [];
    let deletedBlocks = [];
    let updatedBlocks = [];
    let deletedConnections = [];

    const getExtendedBlocks = (block) => {
        if (!block) return;
        let extendedBlocks = {};
        let _blocks = blocks.get();
        extendedBlocks[block.block_id] = block;
        block.connections.forEach(connection => {
            if (connection.prev_block_id) {
                extendedBlocks[connection.prev_block_id] = _blocks.find(block => block.block_id === connection.prev_block_id);
            }
            if (connection.next_block_id) {
                extendedBlocks[connection.next_block_id] = _blocks.find(block => block.block_id === connection.next_block_id);
            }
        })

        return extendedBlocks;
    }


    this.getBlockFromBlockId = ({ block_id }) => blocks.get().find(block => block.block_id === block_id)

    this.processConnection = ({ block, role_id, direction }) => {
        let _updating = {
            block: block,
            role_id: role_id,
            direction: direction === 'in' ? 'prev' : 'next'
        }
        connecting.set(true)


        let connection = block.connections.find(connection => connection.role_id === role_id);
        // remove previous connection;
        if (direction === 'out' && connection.next_block_id) {
            deleteConnection({ block_id: connection.next_block_id, role_id, direction: 'in' });
        } else if (direction === 'in' && connection.prev_block_id) {
            deleteConnection({ block_id: connection.prev_block_id, role_id, direction: 'out' });
        }
        deleteConnection({ block_id: block.block_id, role_id, direction });


        var move = (e) => {
            updateTemporaryConnection({ block_id: block.block_id, role_id: role_id, direction, position: { x: (e.clientX - origin.get().x) / zoom.get(), y: (e.clientY - origin.get().y) / zoom.get() } })
        }

        var end = (e) => {
            let this_id = _updating.block.block_id;


            document.body.removeEventListener("pointermove", move);
            document.body.removeEventListener("pointerup", end);

            connecting.set(false);

            setTimeout(() => {
                visualizeErrors();
            }, 125)

            deleteConnection({ block_id: block.block_id, role_id, direction });

            if (e.target.classList.contains("block") && e.target.id.replace('block_', '') !== this_id) {

                let connecting_id = e.target.id.replace('block_', '');

                updateRoleBlock({ block: _updating.block, role_id: _updating.role_id, direction: _updating.direction, data: connecting_id });
                let block = blocks.get().find(v => v.block_id === connecting_id);
                updateRoleBlock({ block: block, role_id: _updating.role_id, direction: (_updating.direction === 'next' ? 'prev' : 'next'), data: _updating.block.block_id });
                visualizeErrors();

                this.calculateConnections();

            } else {
                console.log('this happens?');
                updateRoleBlock({ block: _updating.block, role_id: _updating.role_id, direction: _updating.direction, data: null });
                this.calculateConnections();
            }
        }

        document.body.addEventListener("pointermove", move);
        document.body.addEventListener("pointerup", end);
    }



    let getCenterDOM = (className) => {
        let DOM = document.querySelector(`.${className}`);
        if (!DOM) return;
        let bound = DOM.getBoundingClientRect();
        let height_padding = className.indexOf('in') === -1 ? bound.height : 1;
        return { x: ((bound.left + bound.width / 2) - origin.get().x) / zoom.get(), y: ((bound.top + height_padding) - origin.get().y) / zoom.get() };
    }

    const calculateBoundsConnection = ({ in_block_id, out_block_id, role_id }) => {
        let start_pos = getCenterDOM(`in_${in_block_id}_${role_id}`);
        let out_pos = getCenterDOM(`out_${out_block_id}_${role_id}`);
        return [start_pos, out_pos];
    }

    const deleteConnections = ({ block_id, connection }) => {
        if (connection.prev_block_id) {
            deleteConnection({ block_id: connection.prev_block_id, role_id: connection.role_id, direction: 'out' });
            deleteConnection({ block_id, role_id: connection.role_id, direction: 'in' });
        }
        if (connection.next_block_id) {
            deleteConnection({ block_id: connection.next_block_id, role_id: connection.role_id, direction: 'in' });
            deleteConnection({ block_id, role_id: connection.role_id, direction: 'out' });
        }
    }

    const deleteConnection = ({ block_id, direction, role_id }) => {
        let _blocks = [...blocks.get()];
        let _block = _blocks.find(_block => _block.block_id === block_id);
        if (_block) {
            let _block_connection = _block.connections.find(connection => connection.role_id === role_id);
            if (!_block_connection) {
                console.error('could not find connection of', JSON.parse(JSON.stringify(_block)), role_id);
            } else {
                if (direction === 'out') {

                    _block_connection.next_block_id = null;

                } else {
                    _block_connection.prev_block_id = null;
                }
                blocks.set(_blocks);
            }
        } else {
            console.error('could not find block ', block_id);
        }

        let _connections = [...connections.get()];
        if (direction === 'out') {
            _connections = _connections.filter(c => !(c.out_block_id === block_id && c.role_id === role_id));
        } else {
            _connections = _connections.filter(c => {
                return !(c.in_block_id === block_id && c.role_id === role_id)
            })
        }
        connections.set(_connections);
    }

    const updateTemporaryConnection = ({ block_id, direction, role_id, position }) => {
        let _connections = [...connections.get()];
        let data, pos;
        if (direction === 'out') {
            pos = [getCenterDOM(`out_${block_id}_${role_id}`), position];
            data = { pos, in_block_id: null, out_block_id: block_id, role_id: role_id };

        } else {
            pos = [position, getCenterDOM(`in_${block_id}_${role_id}`)];
            data = { pos, in_block_id: block_id, out_block_id: null, role_id: role_id };
        }
        let index = _connections.findIndex(c =>
            c.in_block_id === data.in_block_id && c.out_block_id === data.out_block_id && c.role_id === data.role_id);
        index === -1 ? _connections.push(data) : _connections[index] = data;
        connections.set(_connections);
    }



    this.calculateConnections = (_blocks) => {
        _blocks = _blocks ? _blocks : [...blocks.get()];
        if (!_blocks) return;
        let _connections = [...connections.get()];

        _blocks.forEach((block) => {
            if (!block) return;
            block.connections.forEach((connection) => {
                var next_block_id = connection.next_block_id;
                if (!next_block_id) return;
                let pos = calculateBoundsConnection({ in_block_id: next_block_id, out_block_id: block.block_id, role_id: connection.role_id })
                let data = { pos, out_block_id: block.block_id, in_block_id: next_block_id, role_id: connection.role_id };
                let index = _connections.findIndex(c =>
                    c.in_block_id === data.in_block_id && c.out_block_id === data.out_block_id && c.role_id === data.role_id);
                index === -1 ? _connections.push(data) : _connections[index] = data;
            })
        })
        connections.set(_connections);
    }

    this.offsetConnections = ({ block_ids, offset }) => {
        let _connections = connections.get().map(_connection => {
            let _pos = [..._connection.pos];
            if (block_ids.includes(_connection.in_block_id)) {
                if (!_pos[0]) {
                    console.error('_connection.in_block_id', _connection.in_block_id, connections.get())
                } else {
                    _pos[0].x += offset.x;
                    _pos[0].y += offset.y;
                }
            }
            if (block_ids.includes(_connection.out_block_id)) {
                if (!_pos[1]) {
                    console.error('_connection.out_block_id', _connection.out_block_id, connections.get())
                } else {
                    _pos[1].x += offset.x;
                    _pos[1].y += offset.y;
                }
            }
            _connection.pos = _pos;

            return _connection;
        })
        connections.set(_connections);
    }


    this.processPosition = (e, block, _zoom) =>
        new Promise((resolve) => {
            let lastTick = performance.now();

            if (!e.target.classList.contains("block")) return;
            let coords = { x: e.clientX, y: e.clientY };

            e.preventDefault();
            e.stopPropagation();

            const move = (e) => {
                if (performance.now() - lastTick < 1000 / 60) return;
                lastTick = performance.now();
                const offset = {
                    x: (coords.x - e.clientX) * -1 / _zoom,
                    y: (coords.y - e.clientY) * -1 / _zoom
                };
                let block_ids = [];
                let positions = [];
                selectedBlocks.forEach(block => {
                    block_ids.push(block.block_id);
                    positions.push({
                        position: {
                            x: block.position.x + offset.x,
                            y: block.position.y + offset.y
                        }

                    })
                    updatedBlocks.push(block);
                })
                updateBlocks({ block_ids, datas: positions });
                this.offsetConnections({ block_ids: selectedBlocks.map(b => b.block_id), offset })
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
                resolve();
            }

            document.body.addEventListener("pointermove", move);
            document.body.addEventListener("pointerup", end);
            try {
                document.body.setPointerCapture(e.pointerId);
            } catch (e) {
                console.error('no setPointerCapture');
            }
        })

    this.setBoundingBox = ({ block_id, boundingBox }) => {
        updateBlock(block_id, { boundingBox });
    }



    const updateExtendedSelectedBlocks = (_block) => {
        extendedSelectedBlocks = { ...extendedSelectedBlocks, ...getExtendedBlocks(_block) };
    }

    this.isSelected = ({ block_id }) => selectedBlocks.find(block => block.block_id === block_id)





    this.getDuplicatedBlocks = () => [...duplicatedBlocks]
    this.getDeletedBlocks = () => [...deletedBlocks]
    this.getSelectedBlocks = () => [...selectedBlocks]
    this.getUpdatedBlocks = () => [...updatedBlocks]
    this.getDeletedConnections = () => [...deletedConnections]

    this.emptyUpdatedBlocks = () => updatedBlocks = []
    this.emptyDeletedConnections = () => deletedConnections = []
    this.emptyDeletedBlocks = () => deletedBlocks = []
    this.emptyErroredBlocks = () => erroredBlocks = []


    this.errorBlock = ({ block_id }) => {
        erroredBlocks.push(block_id);

    };
    this.hasErrors = ({ block_id }) => {
        return erroredBlocks.indexOf(block_id) != -1;
    };

    this.duplicateSelectedBlocks = function ({ cursor, zoom }) {
        let _origin = origin.get();

        updatedBlocks = [];
        duplicatedBlocks = [];

        var _selectedBlocks = JSON.parse(JSON.stringify(selectedBlocks));

        for (let _selectedBlock of _selectedBlocks) {
            _selectedBlock.selected = false;
            // remove all connections that are not a part of the selection
            for (let _connection of _selectedBlock.connections) {
                if (!_selectedBlocks.find(b => b.block_id === _connection.next_block_id)) {
                    _connection.next_block_id = null;
                }
                if (!_selectedBlocks.find(b => b.block_id === _connection.prev_block_id)) {
                    _connection.prev_block_id = null;
                }
            }
        }

        let lowestValues = { x: null, y: null }
        var _instructions = JSON.parse(JSON.stringify(instructions.get()));

        for (let _selectedBlock of _selectedBlocks) {
            // give a new id for each block and change all the connections to the new id
            let old_block_id = `${_selectedBlock.block_id}`;
            let new_block_id = uniqid();
            duplicatedBlocks.push(new_block_id);
            _selectedBlock.block_id = new_block_id;

            _selectedBlocks.forEach(_s => {
                _s.connections.forEach(_connection => {
                    // _connection.block_id = _selectedBlock.block_id;


                    if (_connection.next_block_id === old_block_id)
                        _connection.next_block_id = new_block_id;
                    if (_connection.prev_block_id === old_block_id)
                        _connection.prev_block_id = new_block_id;
                })
            })

            if (!lowestValues.x || _selectedBlock.position.x < lowestValues.x)
                lowestValues.x = _selectedBlock.position.x;

            if (!lowestValues.y || _selectedBlock.position.y < lowestValues.y)
                lowestValues.y = _selectedBlock.position.y;

            // change all instruction ids and add them to the instruction
            _selectedBlock.instructions = _selectedBlock.instructions.map(instruction_id => {
                let new_id = uniqid();
                _instructions[new_id] = JSON.parse(JSON.stringify(_instructions[instruction_id]));
                return new_id;
            })
        }
        instructions.set(_instructions);


        _selectedBlocks.forEach(_selectedBlock => {
            _selectedBlock.position.x = _selectedBlock.position.x - lowestValues.x + (_origin.x * -1 + cursor.x) / zoom + 400;
            _selectedBlock.position.y = _selectedBlock.position.y - lowestValues.y + (_origin.y * -1 + cursor.y) / zoom;
        })

        updatedBlocks = _selectedBlocks;

        blocks.set([...blocks.get(), ..._selectedBlocks]);
        this.deselectAllBlocks();
        this.calculateConnections(_selectedBlocks);
        this.selectBlocks(_selectedBlocks);
    }

    this.selectBlock = ({ block_id, block }) => {

        block_id = block_id ? block_id : block.block_id;
        block = block ? block : blocks.get().find(b => b.block_id === block_id);



        if (!selectedBlocks.find(b => b.block_id === block_id)) {

            selectedBlocks.push(block);
            updateBlock(block_id, { selected: true })
        }


        updateExtendedSelectedBlocks(block);
    }

    this.selectBlocks = (_blocks) => {

        _blocks.forEach(_block => {
            if (!selectedBlocks.find(b => b.block_id === _block.block_id)) {
                selectedBlocks.push(_block);
                updateBlock(_block.block_id, { selected: true })
            }
            updateExtendedSelectedBlocks(_block);
        })
    }

    this.deselectBlock = (_block) => {
        selectedBlocks = selectedBlocks.filter(b => b.block_id !== _block.block_id);
        extendedSelectedBlocks = {};
        selectedBlocks.forEach(block => updateExtendedSelectedBlocks(block));
        updateBlock(_block.block_id, { selected: false })

    }

    this.deselectAllBlocks = () => {
        selectedBlocks.forEach(_selectedBlock => {
            this.deselectBlock(_selectedBlock);
        })
        selectedBlocks = [];
        extendedSelectedBlocks = {};
    }

    this.deselectAllBlocksExcept = ({ block_id }) => {
        selectedBlocks = selectedBlocks.filter(b => b.block_id !== block_id);
    }

    this.initializeConnection = ({ block_id }) => {
        updateBlock(block_id, { connectionInitialized: true })
    }

    this.setSelected = ({ block_id, selected }) => {
        updateBlock(block_id, { selected })
    }

    /* this.startConnection = (block, role_id, direction) => {
        _connection.start(block, role_id, direction);
    } */

    this.add = async (position) => {
        let result = await openOverlay({ type: 'confirm', data: { text: 'add new block' } });
        //overlay.set(false);
        if (!result) return;
        let t_blocks = blocks.get();
        let newBlock = getDefaultBlock();
        newBlock.position = position;
        t_blocks.push(newBlock);
        blocks.set(t_blocks);
        setTimeout(() => {
            visualizeErrors();
        }, 10)
    }

    const convertRoles = async ({ block }) => {
        // get all different roles of selection
        var _blocks = [...blocks.get()];
        var _roles = roles.get();

        if (selectedBlocks.length === 0) selectedBlocks = [block];
        let _selectedRoles = [];

        selectedBlocks.forEach(selectedBlock => {
            let role_ids = selectedBlock.connections.map(connection => connection.role_id);
            role_ids.forEach(role_id => {
                if (!_selectedRoles.includes(role_id))
                    _selectedRoles.push(role_id);
            })
        })


        let options = {};

        _selectedRoles.forEach(_selectedRole => {
            options[_selectedRole] = _roles.filter(_r => _r !== _selectedRole);
        })

        // to do open overlay where you can convert the roles
        let result = await openOverlay(
            {
                type: 'option_groups',
                data: {
                    options
                }
            });

        if (!result) return;

        let old_role_id = result.title;
        let new_role_id = result.option;

        var _instructions = { ...instructions.get() };
        var _connections = [...connections.get()];

        for (let block of selectedBlocks) {

            // check if it already has a connection with this role_id
            let new_connection = block.connections.find(_c => _c.role_id === new_role_id);
            let old_connection = block.connections.find(_c => _c.role_id === old_role_id);

            if (new_connection) {
                // if yes: delete old_role_id from connection
                block.connections = block.connections.filter(_c => _c.role_id !== old_role_id);
                // if (!old_connection) return;

                if (old_connection && old_connection.next_block_id) {

                    _connections = _connections.filter(connection => {
                        return !(connection.out_block_id === block.block_id &&
                            connection.in_block_id === old_connection.next_block_id &&
                            connection.role_id === old_role_id)
                    });



                    if (!new_connection.next_block_id) {

                        let next_block = _blocks.find(block => block.block_id === old_connection.next_block_id);
                        // check if next_block_id of new_connection is a part of selectedBlocks;
                        if (selectedBlocks.find(selectedBlock => selectedBlock.block_id === new_connection.next_block_id)) {
                            // check if next_block has a connection with the new_role_id + that connection does not yet have a connection
                            // or with old_role_id (as it will be converted later on)
                            let next_block_connection = next_block.connections.find(connection =>
                                ((connection.role_id === new_role_id && !connection.prev_block_id) || connection.role_id === old_role_id)
                            );
                            if (next_block_connection) {
                                new_connection.next_block_id = old_connection.next_block_id;
                                next_block_connection.prev_block_id = block.block_id;
                            }
                        } else {
                            let next_block_connection = next_block.connections.find(connection =>
                                connection.role_id === new_role_id && !connection.prev_block_id
                            );
                            if (next_block_connection) {

                                new_connection.next_block_id = old_connection.next_block_id;
                                next_block_connection.prev_block_id = block.block_id;

                            }
                        }

                    }
                }
                if (old_connection && old_connection.prev_block_id) {
                    _connections = _connections.filter(connection =>
                        !(connection.out_block_id === block.block_id &&
                            connection.in_block_id === old_connection.prev_block_id &&
                            connection.role_id === old_role_id)
                    );
                }

                // check if old_connection had a connection to another block
                // and if the new_connection does not yet have a connection with another block

            } else {
                // if not: get the block connected to it with old_role_id
                let connection = block.connections.find(connection => {

                    return connection.role_id === old_role_id;
                });
                let next_block_id = connection.next_block_id;
                let prev_block_id = connection.prev_block_id;

                connection.role_id = new_role_id;
                // is next_block_id defined?
                if (next_block_id) {
                    // remove the connection from the connections-state
                    _connections = _connections.filter(connection => {
                        return !(connection.out_block_id === block.block_id &&
                            connection.in_block_id === next_block_id &&
                            connection.role_id === old_role_id)
                    });

                    // check if this block is (not) part of the selection
                    if (!selectedBlocks.find(selectedBlock => selectedBlock.block_id === next_block_id)) {
                        let next_block = _blocks.find(block => block.block_id === next_block_id);
                        //// if not: check if block has a  connection w new_role_id 
                        let next_block_connection = next_block.connections.find(connection =>
                            connection.role_id === new_role_id && !connection.prev_block_id);
                        if (!next_block_connection) {
                            ////// if not: connection.next_block_id = null
                            connection.next_block_id = null;
                            next_block.connections.find(connection => connection.role_id === old_role_id).prev_block_id = null;
                        }
                    }
                }
                // check if block has prev_block_id and if it is not included in selectedBlocks
                // as we only calculate connections to next_block_id to prevent double calc
                // we should process these blocks as well
                if (prev_block_id && !selectedBlocks.find(selectedBlock => selectedBlock.block_id === prev_block_id)) {
                    // remove the connection from the co    nnections-state
                    _connections = _connections.filter(connection => {
                        return !(connection.out_block_id === prev_block_id &&
                            connection.in_block_id === block.block_id &&
                            connection.role_id === old_role_id)
                    });

                    let prev_block = _blocks.find(block => block.block_id === prev_block_id);
                    let prev_block_connection = prev_block.connections.find(connection =>
                        connection.role_id === new_role_id && !connection.next_block_id);
                    if (!prev_block_connection) {
                        connection.prev_block_id = null;
                        prev_block.connections.find(connection => connection.role_id === old_role_id).next_block_id = null;
                    }
                }

            }
        }

        console.log(_blocks);

        blocks.set([..._blocks]);
        connections.set([..._connections]);

        // convert instructions from old to new role
        selectedBlocks.forEach(block => {
            block.instructions.forEach(instruction_id => {
                if (_instructions[instruction_id].role_id === old_role_id) {
                    _instructions[instruction_id].role_id = new_role_id;
                }
            })
        })
        instructions.set({ ..._instructions });

        setTimeout(() => {
            this.calculateConnections();
        }, 100);
        setTimeout(() => {
            this.calculateConnections();
        }, 1000);
    }

    this.confirmDelete = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let result = await openOverlay(
            {
                type: 'options',
                data: {
                    text: ``,
                    options: ['delete blocks'/* , 'convert roles' */]
                }
            });

        if (result === 'delete blocks') {
            if (this.getSelectedBlocks().length > 1)
                this.deleteSelectedBlocks();
            else
                deleteBlock({ block })
        } else if (result === 'convert roles') {
            convertRoles({ block })
        }
    }

    this.openRoleOverlay = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();


        let _roles = roles.get().filter(r_role => {
            let foundRole = block.connections.find(connection => {

                return connection.role_id === r_role
            })

            return !foundRole;
        });
        if (_roles.length === 0) return;

        let result = await openOverlay({ type: 'role', data: { block: block, roles: _roles } });
        //overlay.set(false);

        if (!result) return;
        addRoleToConnections({ block: block, role_id: result });
        setTimeout(() => {
            visualizeErrors();
        }, 10)
        setTimeout(() => {
            this.calculateConnections();
        }, 100)
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
        //overlay.set(false);
        if (!result) return;

        let _blocks = [...blocks.get()];
        let _block = _blocks.find(v => v.block_id === block.block_id);

        let _connection = _block.connections.find(v => v.role_id === role_id);
        deleteConnections({ block_id: _block.block_id, connection: _connection });
        let _connections = _block.connections.filter(v => v.role_id !== role_id);

        if (_block.connections.length === 0) {
            deleteBlock({ block });
            return
        }
        let _instructions = instructions.get();

        let hasInstructionsWithRole = _block.instructions.find(v => _instructions[v].role_id === role_id)
        if (hasInstructionsWithRole) {
            result = await openOverlay(
                {
                    type: 'options',
                    data: {
                        text: `convert or delete instructions with role ${role_id}?`,
                        options: ['convert', 'delete']
                    }
                });
            //overlay.set(false);
            if (!result) {
                return;
            } else if (result === 'convert') {
                let convertTo = _block.connections[0];
                _block.instructions.forEach(v => {
                    if (_instructions[v].role_id === role_id) {
                        _instructions[v].role_id = convertTo.role_id
                    }
                });
            } else if (result === 'delete') {
                _block.instructions = _block.instructions.filter(
                    v => _instructions[v].role_id !== role_id);
                if (_block.instructions.length == 0)
                    deleteBlock({ block: _block });
            }
            instructions.set(_instructions);
        }

        _block.connections = _connections;
        blocks.set(_blocks);

        setTimeout(() => {
            this.calculateConnections(Object.values(getExtendedBlocks(_block)));
        }, 100)
    }



    const getDefaultInstruction = (block_id, role_id) => {
        return {
            block_id: block_id,
            script_id: script_id,
            role_id: role_id,
            type: "do",
            sound: false,
            text: ""
        }
    }


    this.deleteSelectedBlocks = () => {
        // remove instructions 
        let t_instructions = { ...instructions.get() };

        selectedBlocks.forEach(selectedBlock => {
            selectedBlock.instructions.forEach(instruction => {
                delete t_instructions[instruction];
            })
            selectedBlock.connections.forEach(connection => deleteConnections({ block_id: selectedBlock.block_id, connection }))
        })
        instructions.set(t_instructions);

        let selectedBlockIds = selectedBlocks.map(selectedBlock => selectedBlock.block_id);

        // remove blocks
        let _blocks = [...blocks.get()];
        _blocks = _blocks.filter(_block => !selectedBlockIds.includes(_block.block_id));
        blocks.set(_blocks);
        deletedBlocks.push([...selectedBlocks.map(selectedBlock => selectedBlock.block_id)]);

        // remove connections
        let _connections = [...connections.get()];
        _connections = _connections.filter(_connection =>
            !(selectedBlockIds.includes(_connection.in_block_id) ||
                selectedBlockIds.includes(_connection.out_block_id)))
        connections.set(_connections);
    }

    const deleteBlock = ({ block }) => {
        // remove from selection
        selectedBlocks = selectedBlocks.filter(selectedBlock => selectedBlock.block_id !== block.id);

        // remove all instructions that are a part of block
        let t_instructions = instructions.get();
        block.instructions.forEach(instruction => {
            delete t_instructions[instruction];
        })
        instructions.set(t_instructions);

        // remove block
        let t_blocks = blocks.get();

        // block.connections.forEach(c => removeConnections(c))
        t_blocks = t_blocks.filter(v => v.block_id !== block.block_id);
        blocks.set(t_blocks);
        deletedBlocks.push(block.block_id);

        // remove connections
        let _connections = [...connections.get()];
        _connections = _connections.filter(_connection =>
            !(_connection.in_block_id === block.block_id ||
                _connection.out_block_id === block.block_id))
        connections.set(_connections);
    }

    const addDefaultInstruction = (block_id, role_id) => {
        let new_instr = getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        let t_instructions = instructions.get();
        t_instructions[instruction_id] = new_instr;
        instructions.set(t_instructions);

        let t_blocks = blocks.get();
        let b_instr = t_blocks.find(v => v.block_id === block_id).instructions;
        b_instr.push(instruction_id);
        blocks.set(t_blocks);
    }

    const addRoleToConnections = ({ block, role_id }) => {
        let t_blocks = blocks.get();
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
        blocks.set(t_blocks);
    }




    const updateRoleBlock = async ({ block, role_id, direction, data }) => {

        let _blocks = [...blocks.get()];
        let _block = _blocks.find(_block => _block.block_id === block.block_id);

        let connection = _block.connections.find(v => v.role_id === role_id);
        if (!connection) {
            let result = await openOverlay({ type: 'confirm', data: { text: 'add role to block' } });
            if (!result) return;
            addRoleToConnections({ block: block, role_id: role_id });
            connection = _block.connections.find(v => v.role_id === role_id);
        }


        /* let prev_data = startConnection[`${direction}_block_id`];

        if (prev_data && typeof prev_data !== 'object') {
            let _direction = direction === 'next' ? 'prev' : 'next';
            let connecting_id = prev_data;
            removeConnection(connecting_id, role_id, _direction);
        } */

        connection[`${direction}_block_id`] = data;

        blocks.set(_blocks);
        setTimeout(() => {
            this.calculateConnections(Object.values(getExtendedBlocks(_block)));
        }, 100)

    }

    const updateBlocks = ({ block_ids, datas }) => {
        let t_blocks = blocks.get();

        block_ids.forEach((block_id, index) => {
            let t_block = t_blocks.find(v => v.block_id === block_id);
            if (!t_block) return;
            Object.keys(datas[index]).forEach((key) => {

                t_block[key] = datas[index][key];
            })
        })



        blocks.set(t_blocks);
    }

    const updateBlock = (block_id, data) => {
        let t_blocks = blocks.get();
        let t_block = t_blocks.find(v => v.block_id === block_id);
        if (!t_block) return;

        Object.keys(data).forEach((key) => {
            t_block[key] = data[key];
        })
        blocks.set(t_blocks);

    }
    const getDefaultBlock = () => {
        let block_id = uniqid();
        return {
            block_id: block_id,
            instructions: [],
            connections: []
        }
    };

    this.addInstruction = ({ block_id, prev_instruction_id, role_id }) => {
        let new_instr = getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        let t_instructions = { ...instructions.get() };



        t_instructions[instruction_id] = new_instr;
        instructions.set(t_instructions);

        let _blocks = [...blocks.get()];

        let _block = _blocks.find(v => v.block_id === block_id);
        let _instructions = _block.instructions;
        let _instruction_index = _instructions.findIndex((v) => v === prev_instruction_id);
        _instructions.splice((_instruction_index + 1), 0, instruction_id);
        blocks.set(_blocks);


        let extendedBlocks = getExtendedBlocks(_block);
        setTimeout(() => {
            this.calculateConnections(Object.values(extendedBlocks));
        }, 0)


        return { instruction_id, instruction: new_instr };
    }

    this.removeInstruction = (block_id, instruction_id) => {
        let _blocks = [...blocks.get()];

        let _block = _blocks.find(v => v.block_id === block_id);
        let _instructions = _block.instructions;

        let _instruction_index = _instructions.findIndex((v) => v === instruction_id);
        _instructions.splice(_instruction_index, 1);
        blocks.set(_blocks);

        let t_instructions = { ...instructions.get() };
        delete t_instructions[instruction_id];
        instructions.set(t_instructions);

        let extendedBlocks = getExtendedBlocks(_block);
        setTimeout(() => {
            this.calculateConnections(Object.values(extendedBlocks));
        }, 0)
    };
}






export default BlockManager;