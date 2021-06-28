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


    this.getBlockFromBlockId = ({ block_id }) => blocks.get().find(block => block.block_id === block_id)

    this.processConnection = ({ block, role_id, direction }) => {
        let _updating = {
            block: block,
            role_id: role_id,
            direction: direction === 'in' ? 'prev' : 'next'
        }
        connecting.set(true)

        // remove previous connection;

        deleteConnection({ block_id: block.block_id, role_id, direction });


        var move = (e) => {
            // updateRoleBlock({ block: _updating.block, role_id: _updating.role_id, direction: _updating.direction, data: { x: e.clientX, y: e.clientY } });
            updateTemporaryConnection({ block_id: block.block_id, role_id: role_id, direction, position: { x: (e.clientX - origin.get().x) / zoom.get(), y: (e.clientY - origin.get().y) / zoom.get() } })
            // updatedBlocks.push(block);
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
                let extendedBlockIds = [_updating.block.block_id, ...getExtendedBlockIds({ block_id: connecting_id })];
                let _blocks = blocks.get().filter(block => extendedBlockIds.indexOf(block.block_id) != -1);
                this.calculateConnections({ _blocks });

            } else {
                updateRoleBlock({ block: _updating.block, role_id: _updating.role_id, direction: _updating.direction, data: null });
                this.calculateConnections({});
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

    const deleteConnection = ({ block_id, direction, role_id }) => {
        let _connections = connections.get();
        //console.log('delete temporary connection!!!!', _connections);

        if (direction === 'out') {

            _connections = _connections.filter(c => {
                //console.log(c, block_id, direction, role_id)
                return !(c.in_block_id === block_id && c.role_id === role_id)
            });

        } else {
            _connections = _connections.filter(c => {
                //console.log(c, block_id, direction, role_id);
                return !(c.out_block_id === block_id && c.role_id === role_id)
            })

        }
        connections.set(_connections);


    }

    const updateTemporaryConnection = ({ block_id, direction, role_id, position }) => {
        let _connections = [...connections.get()];
        let data, pos;
        if (direction === 'out') {
            pos = [getCenterDOM(`out_${block_id}_${role_id}`), position];
            data = { pos, out_block_id: null, in_block_id: block_id, role_id: role_id };

        } else {
            pos = [position, getCenterDOM(`in_${block_id}_${role_id}`)];
            data = { pos, out_block_id: block_id, in_block_id: null, role_id: role_id };
        }
        let index = _connections.findIndex(c =>
            c.in_block_id === data.in_block_id && c.out_block_id === data.out_block_id && c.role_id === data.role_id);
        index === -1 ? _connections.push(data) : _connections[index] = data;
        connections.set(_connections);
        // let pos = calculateBoundsConnection({ in_block_id: next_block_id, out_block_id: block.block_id, role_id: connection.role_id })


        /*         _blocks.forEach((block) => {
                    block.connections.forEach((connection) => {
                        var next_block_id = connection.next_block_id;
                        if (!next_block_id) return;
                        let pos = calculateBoundsConnection({ in_block_id: next_block_id, out_block_id: block.block_id, role_id: connection.role_id })
                        let data = { pos, in_block_id: block.block_id, out_block_id: next_block_id, role_id: connection.role_id };
                        let index = _connections.findIndex(c =>
                            c.in_block_id === data.in_block_id && c.out_block_id === data.out_block_id && c.role_id === data.role_id);
                        index === -1 ? _connections.push(data) : _connections[index] = data;
        
                    })
                }) */
    }

    const removeConnection = (connecting_id, role_id, direction) => {
        let _blocks = blocks.get();
        ////console.log(connecting_id, role_id, direction);
        let _block = _blocks.find((v) => v.block_id === connecting_id);
        let _connection = _block.connections.find(v => v.role_id === role_id);
        if (!_connection) return;
        _connection[`${direction}_block_id`] = null;


        blocks.set(_blocks);
    }

    this.calculateConnections = ({ _blocks }) => {
        _blocks = _blocks ? _blocks : [...blocks.get()];
        if (!_blocks) return;
        let _connections = [...connections.get()];




        _blocks.forEach((block) => {
            if (!block) return;
            block.connections.forEach((connection) => {
                var next_block_id = connection.next_block_id;
                if (!next_block_id) return;
                let pos = calculateBoundsConnection({ in_block_id: next_block_id, out_block_id: block.block_id, role_id: connection.role_id })
                let data = { pos, in_block_id: block.block_id, out_block_id: next_block_id, role_id: connection.role_id };
                let index = _connections.findIndex(c =>
                    c.in_block_id === data.in_block_id && c.out_block_id === data.out_block_id && c.role_id === data.role_id);
                index === -1 ? _connections.push(data) : _connections[index] = data;

            })
        })
        connections.set(_connections);
    }

    this.offsetConnections = ({ _blocks, offset }) => {

    }


    this.processPosition = (e, block, _zoom) =>
        new Promise((resolve) => {
            let lastTick = performance.now();

            if (!e.target.classList.contains("block")) return;

            let coords = { x: e.clientX, y: e.clientY };
            let position = block.position;

            let selected_blocks = blocks.get().filter(block => block.selected);



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
                selected_blocks.forEach(block => {
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
                // this.offsetConnections({ _blocks: Object.values(extendedSelectedBlocks), offset })
                this.calculateConnections({ _blocks: Object.values(extendedSelectedBlocks) });
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

    const getExtendedBlockIds = ({ block_id }) => {
        let extendedBlockIds = [block_id];
        let block = blocks.get().find(b => b.block_id === block_id);
        //console.log(block);

        block.connections.forEach(connection => {
            //console.log(connection.prev_block_id, connection.next_block_id, 'cheeeeeck');
            if (connection.prev_block_id) {
                extendedBlockIds.push(connection.prev_block_id);
            }
            if (connection.next_block_id) {
                extendedBlockIds.push(connection.next_block_id);
            }
        })
        return extendedBlockIds;
    }

    const getExtendedBlocks = ({ block }) => {
        let extendedBlocks = {};
        extendedBlocks[block.block_id] = block;
        block.connections.forEach(connection => {
            if (connection.prev_block_id) {
                extendedBlocks[connection.prev_block_id] = blocks.get().find(block => block.block_id === connection.prev_block_id);
            }
            if (connection.next_block_id) {
                extendedBlocks[connection.next_block_id] = blocks.get().find(block => block.block_id === connection.next_block_id);
            }
        })
        return extendedBlocks;
    }

    const updateExtendedSelectedBlocks = ({ block_id }) => {
        let block = this.getBlockFromBlockId({ block_id });
        extendedSelectedBlocks = { ...extendedSelectedBlocks, ...getExtendedBlocks({ block }) };
    }

    this.isSelected = ({ block_id }) => selectedBlocks.indexOf(block_id) != -1

    this.selectBlock = ({ block_id }) => {
        if (selectedBlocks.indexOf(block_id) === -1) {
            selectedBlocks.push(block_id);
            updateBlock(block_id, { selected: true })
        }
        updateExtendedSelectedBlocks({ block_id });
    }

    this.selectBlocks = ({ block_ids }) => {
        let datas = [];
        block_ids.forEach(block_id => {
            if (selectedBlocks.indexOf(block_id) === -1) {
                selectedBlocks.push(block_id);
                datas.push({ selected: true });
            }
            updateExtendedSelectedBlocks({ block_id });
        })
        updateBlocks({ block_ids, datas })
    }

    this.deselectBlock = ({ block_id }) => {
        selectedBlocks = selectedBlocks.filter(_block_id => _block_id !== block_id);
        updateBlock(block_id, { selected: false });
        extendedSelectedBlocks = {};
        selectedBlocks.forEach(block_id => updateExtendedSelectedBlocks({ block_id }));
    }



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
        // updateBlock(block_id, { error: true })

        erroredBlocks.push(block_id);

    };
    this.hasErrors = ({ block_id }) => {
        return erroredBlocks.indexOf(block_id) != -1;
    };
    // this.emptyDeletedBlocks = () => deletedBlocks = []
    this.getSelectedBlocks = () => {
        // //console.log([...selectedBlocks]);
        // //console.log(blocks.get().filter(block => block.selected));
        return blocks.get().filter(block => block.selected)
    };

    this.duplicateSelectedBlocks = function ({ cursor, zoom }) {
        let _origin = origin.get();

        updatedBlocks = [];
        duplicatedBlocks = [];
        let _blocks = blocks.get();
        let _selectedBlocks = JSON.parse(JSON.stringify(selectedBlocks.map(block_id =>
            _blocks.find(_block => _block.block_id === block_id)
        )));

        for (let _selectedBlock of _selectedBlocks) {
            // remove all connections that are not a part of the selection
            _selectedBlock.connections.forEach(_connection => {
                if (selectedBlocks.indexOf(_connection.next_block_id) == -1) {
                    _connection.next_block_id = '';
                }
                if (selectedBlocks.indexOf(_connection.prev_block_id) == -1) {
                    _connection.prev_block_id = '';
                }
            })
        }

        let lowestValues = { x: null, y: null }

        for (let _selectedBlock of _selectedBlocks) {
            // give a new id for each block and change all the connections to the new id
            let old_block_id = `${_selectedBlock.block_id}`;
            let new_block_id = uniqid();
            duplicatedBlocks.push(new_block_id);
            _selectedBlock.block_id = new_block_id;
            _selectedBlocks.forEach(_selectedBlock => {
                _selectedBlock.connections.forEach(_connection => {
                    _connection.block_id = _selectedBlock.block_id;
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
            let _instructions = JSON.parse(JSON.stringify(instructions.get()));
            _selectedBlock.instructions = _selectedBlock.instructions.map(instruction_id => {
                let new_id = uniqid();
                _instructions[new_id] = JSON.parse(JSON.stringify(_instructions[instruction_id]));
                return new_id;
            })
            instructions.set(_instructions);
        }


        _selectedBlocks.forEach(_selectedBlock => {
            _selectedBlock.position.x = _selectedBlock.position.x - lowestValues.x + (_origin.x * -1 + cursor.x) / zoom + 400;
            _selectedBlock.position.y = _selectedBlock.position.y - lowestValues.y + (_origin.y * -1 + cursor.y) / zoom;
        })

        updatedBlocks = _selectedBlocks;

        this.deselectAllBlocks();
        // add to blocks
        blocks.set([...blocks.get(), ..._selectedBlocks]);
        this.selectBlocks({ block_ids: _selectedBlocks.map(_s => _s.block_id) });

    }



    this.deselectAllBlocks = () => {
        let _blocks = blocks.get();
        let _block;
        selectedBlocks.forEach(block_id => {
            _block = _blocks.find(_block => _block.block_id === block_id);
            if (_block)
                _block.selected = false
        }
        );
        blocks.set(_blocks);
        selectedBlocks = [];
        extendedSelectedBlocks = {};
    }

    this.deselectAllBlocksExcept = ({ block_id }) => {
        let _blocks = blocks.get();
        let _block;
        selectedBlocks.filter(selectedBlock => selectedBlock != block_id).forEach(selectedBlock => {
            _block = _blocks.find(_block => _block.block_id === selectedBlock);
            if (_block)
                _block.selected = false
        }
        );
        blocks.set(_blocks);
        selectedBlocks = [];
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
        let _blocks = blocks.get();
        let _selectedBlocks = _blocks.filter(b => selectedBlocks.indexOf(b.block_id) != -1);
        if (_selectedBlocks.length == 0) _selectedBlocks = [block];
        let _selectedRoles = [];

        _selectedBlocks.forEach(_s => {
            let _roles = _s.connections.map(_c => _c.role_id);
            _roles.forEach(_r => {
                if (_selectedRoles.indexOf(_r) === -1)
                    _selectedRoles.push(_r);
            })
        })

        let _roles = roles.get();

        let options = {};

        _selectedRoles.forEach(_selectedRole => {
            options[_selectedRole] = _roles.filter(_r => _r != _selectedRole);
        })
        //console.log(options);


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

        let _instructions = instructions.get();

        let _connections = connections.get();


        _selectedBlocks.forEach(block => {
            // check if it already has a connection with this role_id
            if (block.connections.find(_c => _c.role_id === new_role_id)) {
                // if yes: delete old_role_id from connection
                block.connections = block.connections.filter(_c => _c.role_id !== old_role_id);
            } else {
                // if not: get the block connected to it with old_role_id
                let connection = block.connections.find(_c => _c.role_id === old_role_id);
                let next_block_id = connection.next_block_id;
                connection.role_id = new_role_id;
                // is this block also part of the selection?
                if (next_block_id && !_selectedBlocks.includes(next_block_id)) {
                    let next_block = _blocks.find(block => block.block_id === next_block_id);
                    console.log(next_block, _blocks, next_block_id);
                    //// if not: check if block has a  connection w new_role_id 
                    if (!next_block.connections.find(connection => connection.role_id === new_role_id)) {
                        ////// if not: convert the role and connection.next_block_id = null

                        connection.next_block_id = null;

                        // remove the connection
                        _connections = _connections.filter(connection => {
                            return !(connection.in_block_id === block.block_id &&
                                connection.out_block_id === next_block_id &&
                                connection.role_id === old_role_id)
                        });
                    }
                }
            }

            /* if (block.connections.find(connection => connection.role_id === new_role_id)) {

            } */
            // check if it already has a connection with this role_id
            /* if (_s.connections.find(_c => _c.role_id === new_role_id)) {
                // delete old_role_id from connection
                _s.connections = _s.connections.filter(_c => _c.role_id !== old_role_id);

            } else {
                // convert 
                let connectionToConvert = _s.connections.find(_c => {
                    //console.log(_c, _c.role_id, old_role_id);
                    return _c.role_id === old_role_id
                });
                if (!connectionToConvert) return;

                //console.log('connectionToConvert', connectionToConvert);
                if (connectionToConvert.next_block_id) {
                    // check if next_block has the new_role_id in its connections

                    _connections = _connections.filter(_c => {
                        return !(_c.in_block_id === block.block_id &&
                            _c.out_block_id === connectionToConvert.next_block_id &&
                            _c.role_id === old_role_id)
                    });

                    

                    let next_block = this.getBlockFromBlockId({ block_id: connectionToConvert.next_block_id });

                    let next_block_connection_old = next_block.connections.find(c => c.role_id === old_role_id);

                    if (next_block_connection_old) {
                        // console.log(old_connection);
                        next_block_connection_old.prev_block_id = null;
                        console.log(next_block_connection_old);
                        // old_connection
                        // next_block.connections[old_role_id] = null;
                    }
                    if (next_block.connections[new_role_id] && !next_block.connections[new_role_id].prev_block_id) {
                        next_block.connections[new_role_id].prev_block_id = block.block_id;
                    }
                }

                // if (connectionToConvert.prev_block_id) {

                //     // check if next_block has the new_role_id in its connections
                //     let prev_block = this.getBlockFromBlockId({ block_id: connectionToConvert.prev_block_id });

                //     _connections = _connections.filter(_c => {
                //         console.log('prev_block_id', _c.role_id, old_role_id, _c.role_id === old_role_id);
                //         return !(_c.out_block_id === block.block_id &&
                //             _c.in_block_id === connectionToConvert.next_block_id &&
                //             _c.role_id === old_role_id)
                //     });

                //     if (prev_block.connections[new_role_id] ) {
                //         prev_block.connections[new_role_id].next_block_id = block.block_id;
                //     }
                // }


                connectionToConvert.role_id = new_role_id;


            } */
        })
        blocks.set({ ..._blocks });
        connections.set({ ..._connections });

        // convert instructions from old to new role
        _selectedBlocks.forEach(block => {
            block.instructions.forEach(instruction_id => {
                if (_instructions[instruction_id].role_id === old_role_id) {
                    _instructions[instruction_id].role_id = new_role_id;
                }
            })
        })
        instructions.set({ ..._instructions });
    }

    this.confirmDelete = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let result = await openOverlay(
            {
                type: 'options',
                data: {
                    text: ``,
                    options: ['delete blocks', 'convert roles']
                }
            });
        //console.log(result);
        if (result === 'delete blocks') {
            if (this.getSelectedBlocks().length > 1)
                deleteSelectedBlocks();
            else
                deleteBlock({ block })
        } else {
            convertRoles({ block })
        }
    }

    this.openRoleOverlay = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();
        //////console.log('eeeeeeeeeeeeeee', roles.get());

        let _roles = roles.get().filter(r_role => {
            let foundRole = block.connections.find(connection => {
                //////console.log(connection.role_id, r_role, connection.role_id === r_role);
                return connection.role_id === r_role
            })
            //////console.log('did i find the role? ', foundRole);
            return !foundRole;
        });
        if (_roles.length === 0) return;
        //////console.log('openROleOverlay ', roles);
        let result = await openOverlay({ type: 'role', data: { block: block, roles: _roles } });
        //overlay.set(false);

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
        //overlay.set(false);
        if (!result) return;

        let t_blocks = blocks.get();
        let t_block = t_blocks.find(v => v.block_id === block.block_id);

        let _connection = t_block.connections.find(v => v.role_id === role_id);
        removeConnections(_connection);
        let _connections = t_block.connections.filter(v => v.role_id !== role_id);

        if (t_block.connections.length == 0) {
            deleteBlock({ block });
            return
        }
        let _instructions = instructions.get();

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
            //overlay.set(false);
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
                    deleteBlock({ block: t_block });
            }
            instructions.set(_instructions);
        }

        t_block.connections = _connections;
        blocks.set(t_blocks);
    }

    // this.setSelectedBlocks = () => selectedBlocks;


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

    const removeConnections = (c) => {
        if (c.prev_block_id) {
            removeConnection(c.prev_block_id, c.role_id, 'next');
        }
        if (c.next_block_id) {
            removeConnection(c.next_block_id, c.role_id, 'prev');
        }
    }

    const deleteSelectedBlocks = () => {
        // let 
        let deleting_blocks = blocks.get().filter(block => selectedBlocks.find(s => s === block.block_id));

        let t_instructions = instructions.get();
        deleting_blocks.forEach(deleting_block => {
            deleting_block.instructions.forEach(instruction => {
                delete t_instructions[instruction];
            })
            deleting_block.connections.forEach(c => removeConnections(c))

        })
        instructions.set(t_instructions);

        let _blocks = blocks.get().filter(block => !selectedBlocks.find(s => s === block.block_id))
        blocks.set(_blocks);
        deletedBlocks.push([...deleting_blocks.map(b => b.block_id)]);

    }

    const deleteBlock = ({ block }) => {
        // remove from selection
        selectedBlocks = selectedBlocks.filter(block_id => block_id !== block.id);

        // remove all instructions that are a part of block
        let t_instructions = instructions.get();
        block.instructions.forEach(instruction => {
            delete t_instructions[instruction];
        })
        instructions.set(t_instructions);

        // remove block
        let t_blocks = blocks.get();

        block.connections.forEach(c => removeConnections(c))
        t_blocks = t_blocks.filter(v => v.block_id !== block.block_id);
        blocks.set(t_blocks);
        deletedBlocks.push(block.block_id);


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
        //console.log('updateRoleBlock', data);
        let t_blocks = blocks.get();
        let _block = t_blocks.find(b => b.block_id === block.block_id);

        let startConnection = _block.connections.find(v => v.role_id === role_id);
        if (!startConnection) {
            let result = await openOverlay({ type: 'confirm', data: { text: 'add role to block' } });
            if (!result) return;
            addRoleToConnections({ block: block, role_id: role_id });
            startConnection = _block.connections.find(v => v.role_id === role_id);
        }
        let prev_data = startConnection[`${direction}_block_id`];
        if (prev_data && typeof prev_data !== 'object') {
            let _direction = direction === 'next' ? 'prev' : 'next';
            let connecting_id = prev_data;
            removeConnection(connecting_id, role_id, _direction);
        }
        startConnection[`${direction}_block_id`] = data;

        blocks.set(t_blocks);
        setTimeout(() => {
            this.calculateConnections({});
        }, 0)

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

        //console.log('instructions ', t_instructions, instructions);

        t_instructions[instruction_id] = new_instr;
        instructions.set(t_instructions);

        let _blocks = [...blocks.get()];

        let _block = _blocks.find(v => v.block_id === block_id);
        let _instructions = _block.instructions;
        let _instruction_index = _instructions.findIndex((v) => v === prev_instruction_id);
        _instructions.splice((_instruction_index + 1), 0, instruction_id);
        blocks.set(_blocks);


        let extendedBlocks = getExtendedBlocks({ block: _block });
        setTimeout(() => {
            this.calculateConnections({ blocks: Object.values(extendedBlocks) });
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

        let extendedBlocks = getExtendedBlocks({ block: _block });
        setTimeout(() => {
            this.calculateConnections({ blocks: Object.values(extendedBlocks) });
        }, 0)
    };
}






export default BlockManager;