import cursorEventHandler from "../helpers/cursorEventHandler";

const EditorManager = function ({
    stateManager,
    scriptState, setScriptState,
    editorState, setEditorState

}) {

    //// INTERNAL FUNCTIONS

    let getCenterDOM = (className) => {
        let DOM = document.querySelector(`.${className}`);
        if (!DOM) return;
        let bound = DOM.getBoundingClientRect();
        let height_padding = className.indexOf('in') === -1 ? bound.height : 1;
        return { x: ((bound.left + bound.width / 2) - getOrigin().x) / editorState.navigation.zoom, y: ((bound.top + height_padding) - getOrigin().y) / editorState.navigation.zoom };
    }

    const calculateBoundsConnection = ({ in_block_id, out_block_id, role_id }) => {
        let start_pos = getCenterDOM(`in_${in_block_id}_${role_id}`);
        let out_pos = getCenterDOM(`out_${out_block_id}_${role_id}`);
        return [start_pos, out_pos];
    }

    //// PUBLIC FUNCTIONS

    this.setSelectionBox = (bool) => setEditorState("gui", "selectionBox", bool)
    this.setOrigin = (origin) => setEditorState("navigation", "origin", origin)

    this.openOverlay = async function ({ type, data }) {
        return new Promise((_resolve) => {
            const resolve = (data) => {
                setEditorState("gui", "overlay", false)
                _resolve(data);
            }
            const position = {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            }
            setEditorState("gui", "overlay", { type, data, position, resolve })
        })
    }

    this.openRoleOverlay = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let _roles = roles.filter(r_role => {
            let foundRole = block.ports.find(connection => {

                return connection.role_id === r_role
            })

            return !foundRole;
        });
        if (_roles.length === 0) return;

        return await this.openOverlay({
            type: 'role',
            data: { block: block, roles: _roles }
        });
    }

    // navigation

    this.zoomIn = (e) => {
        let new_zoom = editorState.navigation.zoom * 1.3;
        let new_origin = {
            x: getOrigin().x + (0.3) * (getOrigin().x - window.innerWidth / 2),
            y: getOrigin().y + (0.3) * (getOrigin().y - window.innerHeight / 2)
        }

        setEditorState("navigation", "origin", new_origin);
        setEditorState("navigation", "zoom", new_zoom);

        if (new_zoom > 0.4) {
            setEditorState("bools", "isZoomedOut", false)
        }
    }

    this.zoomOut = (e) => {
        let zoom = editorState.navigation.zoom * 0.7;
        let origin = editorState.navigation.origin;
        origin = {
            x: origin.x - (0.3) * (origin.x - window.innerWidth / 2),
            y: origin.y - (0.3) * (origin.y - window.innerHeight / 2)
        }
        setEditorState("navigation", "origin", origin);
        setEditorState("navigation", "zoom", zoom)

        if (new_zoom < 0.4) {
            setEditorState("bools", "isZoomedOut", false)
        }
    }

    // related to connections

    this.removeConnection = ({ block_id, direction, role_id }) => {
        let connections = editorState.elements.ports;
        if (direction === 'out') {
            connections = connections.filter(c => !(c.out_block_id === block_id && c.role_id === role_id));
        } else {
            connections = connections.filter(c => {
                return !(c.in_block_id === block_id && c.role_id === role_id)
            })
        }
        // setConnections([...connections]);
        setEditorState("elements", "connections", [...connections])
    }

    this.calculateConnections = (blocks) => {
        if (!blocks) blocks = scriptState.blocks;

        let connections = editorState.computed.connections;

        blocks.forEach((block) => {
            block.ports.forEach(
                connection => {
                    let next_block_id = connection.next_block_id;
                    if (!next_block_id) return;

                    let pos = calculateBoundsConnection({
                        in_block_id: next_block_id,
                        out_block_id: block.block_id,
                        role_id: connection.role_id
                    })
                    let data = {
                        pos,
                        out_block_id: block.block_id,
                        in_block_id: next_block_id,
                        role_id: connection.role_id
                    }
                    let index = connections.findIndex(
                        c =>
                            c.in_block_id === data.in_block_id &&
                            c.out_block_id === data.out_block_id &&
                            c.role_id === data.role_id
                    );
                    index === -1 ?
                        connections.push(data) :
                        connections[index] = data;
                }
            )
        })
        setEditorState("computed", "connections", connections);
    }

    this.updateTemporaryConnection = ({ block_id, direction, role_id, position }) => {
        let connections = editorState.computed.connections;
        let data, pos;
        if (direction === 'out') {
            pos = [getCenterDOM(`out_${block_id}_${role_id}`), position];
            data = { pos, in_block_id: null, out_block_id: block_id, role_id: role_id };

        } else {
            pos = [position, getCenterDOM(`in_${block_id}_${role_id}`)];
            data = { pos, in_block_id: block_id, out_block_id: null, role_id: role_id };
        }
        let index = connections.findIndex(c =>
            c.in_block_id === data.in_block_id && c.out_block_id === data.out_block_id && c.role_id === data.role_id);
        index === -1 ? connections.push(data) : connections[index] = data;
        setEditorState("computed", "connections", connections);

    }
}

function InstructionsManager({
    stateManager,
    scriptState, setScriptState,
    script_id,
    urls,
}) {
    let uniqid = () => { };

    const getDefaultInstruction = (block_id, role_id) => {
        return {
            block_id: block_id,
            script_id: script_id,
            role_id: role_id,
            type: "do",
            text: ""
        }
    }

    this.add = ({ block_id, role_id }) => {
        let instruction = getDefaultInstruction(block_id, role_id);
        let instruction_id = uniqid();
        setScriptState("instructions", instruction_id, instruction);
        return instruction_id;
    }

    this.remove = (block_id, instruction_id) => {
        let instructions = scriptState.instructions;
        delete instructions[instruction_id];

        setScriptState("instructions", instructions);
        stateManager.blocks.removeInstructionId();
    };

    this.change = (instruction_id, data) => {
        for (let key in data) {
            setScriptState("instructions", instruction_id, key, data[key]);
        }
    }
}

const BlocksManager = function ({
    stateManager,
    scriptState, setScriptState,
    editorState, setEditorState

}) {

    let erroredBlocks = [];
    let extendedSelectedBlocks = {};
    let duplicatedBlocks = [];
    let deletedBlocks = [];
    // let updatedBlocks = [];
    let deletedConnections = [];

    // INTERNALS

    let uniqid = () => { };



    const getDefaultBlock = () => {
        let block_id = uniqid();
        return {
            block_id: block_id,
            instructions: [],
            connections: [],
            position: {}
        }
    };


    const deleteBlock = ({ block }) => {
        // remove from selection
        let index = editorState.selectedBlockIds.indexOf(block.block_id);
        if (index != -1) {
            setEditorState("selectedBlockIds", editorState.selectedBlockIds.splice(index, 1));
        }

        // remove all instructions that are a part of block
        let instructions = scriptState.instructions;
        block.instructions.forEach(instruction => {
            delete instructions[instruction];
        })
        setScriptState("instructions", instructions);
        // remove block

        let blocks = scriptState.blocks;
        delete blocks[block.block_id];
        setScriptState("blocks", block);

        // remove connections
        let connections = editorState.computed.connections;
        Object.values(connections).forEach(connection => {
            if (connection.in_block_id === block.block_id ||
                connection.out_block_id === block.block_id) {
                delete connections[block.block_id]
            }
        })
        setEditorState("computed", "connections", connections);
    }

    const addRoleToConnections = ({ block, role_id }) => {
        if (block.ports.length === 0) {
            let instruction_id = stateManager.instructions.add({ block_id, role_id });
            this.addInstructionId(instruction_id);
        }
        block.ports = [...block.ports, {
            role_id: role_id,
            block_id: block.block_id,
            script_id: script_id,
            prev_block_id: null,
            next_block_id: null
        }]
        block.ports.sort((a, b) => a.role_id > b.role_id);
        setBlocks({ ...getBlocks });
    }




    const offsetConnections = ({ block_ids, offset }) => {
        let _connections = connections.map(_connection => {
            let _pos = [..._connection.pos];
            if (block_ids.includes(_connection.in_block_id)) {
                if (!_pos[0]) {
                    console.error('_connection.in_block_id', _connection.in_block_id, connections)
                } else {
                    _pos[0].x += offset.x;
                    _pos[0].y += offset.y;
                }
            }
            if (block_ids.includes(_connection.out_block_id)) {
                if (!_pos[1]) {
                    console.error('_connection.out_block_id', _connection.out_block_id, connections)
                } else {
                    _pos[1].x += offset.x;
                    _pos[1].y += offset.y;
                }
            }
            _connection.pos = _pos;

            return _connection;
        })
        setConnections(_connections);
    }

    const updateExtendedSelectedBlocks = (_block) => {
        extendedSelectedBlocks = { ...extendedSelectedBlocks, ...getExtendedBlocks(_block) };
    }

    // TODO: re-implement convertRoles

    const convertRoles = async ({ block }) => {
        console.error("convertRoles is not implemented");

    }

    // PUBLIC FUNCTIONS

    this.updateBlock = (block_id, data) => {
        let block = scriptState.blocks[block_id]
        if (!block) return;

        Object.keys(data).forEach((key) => {

            setScriptState("blocks", block_id, key, data[key]);

        })
    }

    this.add = async (position) => {
        let result = await stateManager.editor.openOverlay({ type: 'confirm', data: { text: 'add new block' } });
        if (!result) return;
        let block = getDefaultBlock();
        block.position = position;
        setScriptState("blocks", block.block_id, block);
        /* setTimeout(() => {
            visualizeErrors();
        }, 10) */
    }

    this.addInstructionId = (block_id, prev_instruction_id) => {
        let instruction_ids = scriptState.blocks[block_id].instructions;
        let instruction_index = instruction_ids.indexOf(prev_instruction_id);
        instruction_ids.splice((instruction_index + 1), 0, instruction_id);
        setScriptState("blocks", block_id, "instructions", instruction_ids)
    }

    this.removeInstructionId = (block_id, instruction_id) => {
        let instruction_ids = blocks.find(v => v.block_id === block_id).instructions;
        let instruction_index = instruction_ids.indexOf(instruction_id);
        instruction_ids.splice(instruction_index, 1);
        setScriptState("blocks", block_id, "instructions", instruction_ids);
    }



    /*     this.this.updateBlocks = ({ block_ids, datas }) => {
    
            block_ids.forEach((block_id, index) => {
                let block = blocks.find(v =>
                    v.block_id === block_id
                );
                if (!block) return;
                Object.keys(datas[index]).forEach((key) => {
                    block[key] = datas[index][key];
                })
            })
    
            setBlocks(blocks);
        } */

    this.processConnection = ({ block, role_id, direction }) => {
        console.error("not implemented")

    }

    this.setBoundingBox = ({ block_id, boundingBox }) => {
        this.updateBlock(block_id, { boundingBox });
    }

    this.errorBlock = ({ block_id }) => {
        erroredBlocks.push(block_id);
    };

    this.hasErrors = ({ block_id }) => {
        return erroredBlocks.indexOf(block_id) != -1;
    };

    this.confirmDelete = async (e, block) => {
        e.preventDefault();
        e.stopPropagation();

        let result = await stateManager.editor.openOverlay(
            {
                type: 'options',
                data: {
                    text: ``,
                    options: ['delete blocks'/* , 'convert roles' */]
                }
            });

        if (result === 'delete blocks') {
            if (editorState.selectedBlockIds.length > 1)
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


        let _roles = roles.filter(r_role => {
            let foundRole = block.ports.find(connection => {

                return connection.role_id === r_role
            })

            return !foundRole;
        });
        if (_roles.length === 0) return;

        let result = await stateManager.editor.openOverlay({ type: 'role', data: { block: block, roles: _roles } });
        //overlay.set(false);

        if (!result) return;
        addRoleToConnections({ block: block, role_id: result });
        setTimeout(() => {
            visualizeErrors();
        }, 10)
        setTimeout(() => {
            stateManager.calculateConnections();
        }, 100)
    }

    this.removeRole = async ({ role_id, block }) => {
        console.error("not implemented");
        /* let _connection = block.ports.find(v => v.role_id === role_id);
        removeConnections({ block_id: block.block_id, connection: _connection });
        let _connections = block.ports.filter(v => v.role_id !== role_id);

        if (block.ports.length === 0) {
            deleteBlock({ block });
            return
        }
        let _instructions = instructions;

        let hasInstructionsWithRole = block.instructions.find(v => _instructions[v].role_id === role_id)
        if (hasInstructionsWithRole) {
            let result = await stateManager.editor.openOverlay(
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
                let convertTo = block.ports[0];
                block.instructions.forEach(v => {
                    if (_instructions[v].role_id === role_id) {
                        _instructions[v].role_id = convertTo.role_id
                    }
                });
            } else if (result === 'delete') {
                block.instructions = block.instructions.filter(
                    v => _instructions[v].role_id !== role_id);
                if (block.instructions.length == 0)
                    deleteBlock({ block });
            }
            setInstructions(_instructions);
        }

        block.ports = _connections;
        setBlocks(blocks);

        setTimeout(() => {
            this.calculateConnections(Object.values(getExtendedBlocks(block)));
        }, 100) */
    }

    // TODO: figure out more elegant way to handle selections
    // TODO: re-implement duplication

    this.duplicateSelectedBlocks = function () {
        console.error("duplicateSelectedBlocks is not implemented");

    }

    this.selectBlock = ({ block_id, block }) => {
        block_id = block_id ? block_id : block.block_id;
        block = block ? block : blocks.find(b => b.block_id === block_id);

        if (editorState.selectedBlockIds.indexOf(block_id) == -1) return;

        setEditorState("selectedBlockIds", [...editorState.selectedBlockIds, block_id])
        // updateExtendedSelectedBlocks(block);
    }

    this.translateSelectedBlocks = ({ offset }) => {
        let block, position;
        editorState.selectedBlockIds.forEach(block_id => {
            block = scriptState.blocks[block_id];
            position = {
                x: block.position.x + offset.x,
                y: block.position.y + offset.y
            }

            this.updateBlock(block_id, { position });
        })
    }

    this.addToSelectedBlockIds = ({ block_id }) => {
        if (editorState.selectedBlockIds.indexOf(block_id) == -1) {
            setEditorState("selectedBlockIds", [...editorState.selectedBlockIds, block_id]);
        }
    }

    this.deselectBlock = (_block) => {
        setEditorState("selectedBlockIds", editorState.selectedBlockIds.filter(b => b.block_id !== _block.block_id));
    }



    this.deleteSelectedBlocks = () => {
        console.error("not implemented yet");
        // remove instructions 
        /*         let t_instructions = { ...instructions };
        
                selectedBlocks.forEach(selectedBlock => {
                    selectedBlock.instructions.forEach(instruction => {
                        delete t_instructions[instruction];
                    })
                    selectedBlock.ports.forEach(connection => removeConnections({ block_id: selectedBlock.block_id, connection }))
                })
                setScriptState("instructions", t_instructions);
                // setInstructions(t_instructions);
        
                let selectedBlockIds = selectedBlocks.map(selectedBlock => selectedBlock.block_id);
        
                // remove blocks
                setBlocks(blocks.filter(_block => !selectedBlockIds.includes(_block.block_id)));
                deletedBlocks.push([...selectedBlocks.map(selectedBlock => selectedBlock.block_id)]);
        
                // remove connections
                let _connections = [...ports];
                _connections = _connections.filter(_connection =>
                    !(selectedBlockIds.includes(_connection.in_block_id) ||
                        selectedBlockIds.includes(_connection.out_block_id)))
                setConnections(_connections); */
    }

    this.isSelected = ({ block_id }) => selectedBlocks.find(block => block.block_id === block_id)

    this.getDuplicatedBlocks = () => [...duplicatedBlocks]
    this.getDeletedBlocks = () => [...deletedBlocks]
    // this.getSelectedBlocks = () => [...selectedBlocks]
    this.getUpdatedBlocks = () => [...updatedBlocks]
    this.getDeletedConnections = () => [...deletedConnections]

    this.emptyUpdatedBlocks = () => updatedBlocks = []
    this.emptyDeletedConnections = () => deletedConnections = []
    this.emptyDeletedBlocks = () => deletedBlocks = []
    this.emptyErroredBlocks = () => erroredBlocks = []
}

const StateManager = function ({
    scriptState, setScriptState,
    editorState, setEditorState
}) {
    this.editor = new EditorManager({
        stateManager: this,
        scriptState, setScriptState,
        editorState, setEditorState
    });

    this.blocks = new BlocksManager({
        stateManager: this,
        UI: this.editor,
        scriptState, setScriptState,
        editorState, setEditorState

    });

    this.instructions = new InstructionsManager({
        stateManager: this,
        scriptState, setScriptState,
        editorState, setEditorState
    });
}

export default StateManager