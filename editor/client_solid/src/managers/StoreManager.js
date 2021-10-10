import cursorEventHandler from "../helpers/cursorEventHandler";

const uniqid = () => { };


const EditorManager = function ({
    storeManager,
    scriptState,
    editorState, setEditorState

}) {
    //// INTERNALS


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

    this.addToSelectedBlockIds = (block_id) => {
        if (editorState.selected_block_ids.indexOf(block_id) != -1) return;
        setEditorState("selected_block_ids", [...editorState.selected_block_ids, block_id]);
    }

    this.removeFromSelectedBlockIds = (block_id) => {
        let index = editorState.selected_block_ids.indexOf(block.block_id);
        if (index === -1) return;
        setEditorState("selected_block_ids", editorState.selected_block_ids.splice(index, 1));
    }

    this.emptySelectedBlockIds = () => {
        setEditorState("selected_block_ids", []);
    }

    this.updateRoleOffset = ({ block_id, role_id, direction, offset }) => {
        if (!(block_id in editorState.role_offsets)) {
            setEditorState("role_offsets", block_id, {});
        }
        if (!(role_id in editorState.role_offsets[block_id])) {
            setEditorState("role_offsets", block_id, role_id, {});
        }
        setEditorState("role_offsets", block_id, role_id, direction, offset)
    }
    this.updateBlockDimension = ({ block_id, dimension }) => {
        setEditorState("block_dimensions", block_id, dimension)
    }
}

const ScriptManager = function ({
    editorManager,
    editorState,
    scriptState, setScriptState,
    script_id,
}) {
    this.instructions = new function () {

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
            storeManager.blocks.removeInstructionId();
        };

        this.change = (instruction_id, data) => {
            for (let key in data) {
                setScriptState("instructions", instruction_id, key, data[key]);
            }
        }
    }

    this.blocks = new function () {

        const updateBlock = (block_id, data) => {
            let block = scriptState.blocks[block_id]
            if (!block) return;

            Object.keys(data).forEach((key) => {

                setScriptState("blocks", block_id, key, data[key]);

            })
        }

        // INTERNAL FUNCTIONS

        const getDefaultBlock = () => {
            let block_id = uniqid();
            return {
                block_id: block_id,
                instructions: [],
                connections: [],
                position: {},
                meta: {
                    selected: false,
                }
            }
        };

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

        const deleteBlock = ({ block }) => {
            // remove from selection
            let index = editorState.selected_block_ids.indexOf(block.block_id);
            if (index != -1) {
                setEditorState("selected_block_ids", editorState.selected_block_ids.splice(index, 1));
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
            let connections = editorState.computed.ports;
            Object.values(connections).forEach(connection => {
                if (connection.in_block_id === block.block_id ||
                    connection.out_block_id === block.block_id) {
                    delete connections[block.block_id]
                }
            })
            setEditorState("computed", "connections", connections);
        }


        // EXTERNAL ACCESSIBLE FUNCTIONS

        this.addRole = ({ block_id, role_id }) => {
            if (block.ports.length === 0) {
                let instruction_id = storeManager.instructions.add({ block_id, role_id });
                this.addInstructionId(instruction_id);
            }

            let new_port = {
                role_id: role_id,
                block_id: block.block_id,
                prev_block_id: null,
                next_block_id: null
            }

            setScriptState("blocks", block_id, "ports", role_id, new_port)
        }

        this.convertRoles = async ({ block }) => {
            console.error("convertRoles is not implemented");

        }

        this.selectBlock = (block_id) => {
            setScriptState("blocks", block_id, "meta", "selected", true);
            editorManager.addToSelectedBlockIds(block_id);
        }

        this.deselectBlock = (block_id) => {
            setScriptState("blocks", block_id, "meta", "selected", true);
            editorManager.removeFromSelectedBlockIds(block_id);
        }

        this.deselectAllBlocks = () => {
            editorState.selected_block_ids.forEach(
                selected_block_id => this.deselectBlock(selected_block_id)
            )
        }

        this.addInstructionId = ({ block_id, instruction_id, prev_instruction_id }) => {
            let instruction_ids = scriptState.blocks[block_id].instructions;
            let prev_instruction_index = instruction_ids.indexOf(prev_instruction_id);
            instruction_ids.splice(prev_instruction_index + 1, 0, instruction_id);
            setScriptState("blocks", block_id, "instructions", instruction_ids)
        }

        this.removeInstructionId = ({ block_id, instruction_id }) => {
            let instruction_ids = blocks.find(v => v.block_id === block_id).instructions;
            let instruction_index = instruction_ids.indexOf(instruction_id);
            instruction_ids.splice(instruction_index, 1);
            setScriptState("blocks", block_id, "instructions", instruction_ids);
        }

        this.translateSelectedBlocks = ({ offset }) => {
            let block, position;
            editorState.selected_block_ids.forEach(block_id => {
                block = scriptState.blocks[block_id];
                position = {
                    x: block.position.x + offset.x,
                    y: block.position.y + offset.y
                }

                updateBlock(block_id, { position });
            })
        }

    }

}

const StoreManager = function ({
    scriptState, setScriptState,
    editorState, setEditorState,
    script_id
}) {
    this.editor = new EditorManager({
        storeManager: this,
        scriptState,
        editorState, setEditorState
    });

    this.scripts = new ScriptManager({
        editorManager: this.editor,
        editorState,
        scriptState, setScriptState,
        script_id,
    })
}

export default StoreManager