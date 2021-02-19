export default function DataProcessor() {

    this.checkConnections = async ({ blocks, roles }) => {
        let _errors = {};
        // process sequence of instructions per role
        for (let role of roles) {
            let check = await getOrderedBlocksRole({ blocks: blocks, role_id: role.role_id });
            if (!check.success) {
                for (let direction in check.errors) {
                    for (let block_id of check.errors[direction]) {
                        if (!(block_id in _errors))
                            _errors[block_id] = {};
                        !(_errors[block_id][direction]) ?
                            _errors[block_id][direction] = [role.role_id] :
                            _errors[block_id][direction] = [role.role_id, ..._errors[block_id][direction]];
                    }

                }
            }
        }
        console.log(_errors);

        return { success: Object.values(_errors).length === 0, errors: _errors }
    }


    this.process = async ({ roles, blocks, instructions, safe }) => {
        var { roles, errors } = await processRoles({ roles, blocks, instructions });
        if (Object.values(errors).filter(e => e.length !== 0).length != 0) {
            if (safe) {
                let _confirm = window.alert('there are multiple entry/exit points. this script will not be playable.');
                return { success: false, errors: errors };
            } else {
                let _confirm = window.confirm('there are multiple entry points. this script will not be playable. do you still want to save?');
                if (!_confirm) {
                    return { success: false, errors: errors };
                }
            }
        }
        var { blocks, instructions } = processInstructions({ blocks, instructions });
        return { success: true, roles: roles, instructions: instructions, blocks: blocks }
    }

    const processRoles = async ({ roles, blocks, instructions }) => {
        let _roles = {};
        let _errors = {};
        for (let role of roles) {
            let r_blocks = await getOrderedBlocksRole({ blocks: blocks, role_id: role.role_id });
            if (!r_blocks.success) {
                _errors[role.role_id] = r_blocks.errors
            } else {
                let _instructions = getAllInstructionsRole({ blocks: r_blocks.blocks, instructions: instructions, role_id: role.role_id });
                _roles[role.role_id] = _instructions;
            }
        }
        return { roles: _roles, errors: _errors }
    }

    const processInstructions = ({ blocks, instructions }) => {
        const processLastInstruction = ({ block, role, instruction, count }) => {
            let connection = block.connections.find(v => v.role_id === role);
            let next_block_id = connection.next_block_id;

            instructions[instruction].next_role_ids = [];

            block.connections.forEach((connection) => {
                let next_block_id = connection.next_block_id;
                if (!!next_block_id) {
                    let connected_block = blocks.find(v => v.block_id === next_block_id);
                    let next_instruction_id = connected_block.instructions[0];
                    let next_role_id = instructions[next_instruction_id].role_id;
                    instructions[instruction].next_role_ids.push(next_role_id);
                }
            })
        }
        const processFirstInstruction = ({ block, role, instruction, count }) => {
            instructions[instruction].prev_instruction_ids = [];
            block.connections.forEach((connection) => {
                let prev_block_id = connection.prev_block_id;
                if (!!prev_block_id) {
                    let connected_block = blocks.find(v => v.block_id === prev_block_id);
                    let prev_instruction_id = connected_block.instructions[connected_block.instructions.length - 1];
                    instructions[instruction].prev_instruction_ids.push(prev_instruction_id);
                }
            })
        }
        const getNextInBlock = ({ block, role, instruction, count }) => {
            instructions[instruction].next_role_ids = [instructions[block.instructions[count + 1]].role_id]
        }
        const getPrevInBlock = ({ block, role, instruction, count }) => {
            instructions[instruction].prev_instruction_ids = [block.instructions[count - 1]]
        }

        for (let block of blocks) {

            let count = 0;

            for (let instruction of block.instructions) {
                let role = instructions[instruction].role_id;
                if (count === 0) {
                    processFirstInstruction({ block, role, instruction, count })
                    if (1 !== block.instructions.length) {
                        getNextInBlock({ block, role, instruction, count });
                    }
                }
                if (count === block.instructions.length - 1) {
                    processLastInstruction({ block, role, instruction, count })
                    if (1 !== block.instructions.length) {
                        getPrevInBlock({ block, role, instruction, count });
                    }
                }
                if (count !== 0 && count !== block.instructions.length - 1) {
                    getPrevInBlock({ block, role, instruction, count });
                    getNextInBlock({ block, role, instruction, count });
                }
                count++
            }
        }

        return { blocks, instructions }
    }

    const getOrderedBlocksRole = async ({ blocks, role_id }) => {
        let __ = {
            start: null,
            end: null,
            blocks: [],
            errors: { start: [], end: [] }
        };
        blocks.forEach(block => {
            // check if block has connection with this role_id
            let connection = block.connections.find(c => c.role_id === role_id);
            if (!connection) return;
            __.blocks.push({
                block: block,
                prev_block_id: connection.prev_block_id,
                next_block_id: connection.next_block_id
            });
            // check if multiple entry / exit points of role
            if (!connection.prev_block_id)
                // check if there is no start of the role yet
                !__.start ?
                    __.start = block.block_id :
                    // else error
                    __.errors.start.length === 0 ?
                        __.errors.start = [__.start, block.block_id] :
                        __.errors.start = [block.block_id, ...__.errors.start];

            if (!connection.next_block_id)
                !__.end ?
                    __.end = block.block_id :
                    __.errors.end.length === 0 ?
                        __.errors.end = [__.end, block.block_id] :
                        __.errors.end = [block.block_id, ...__.errors.end];

        })
        if (__.errors.end.length !== 0 || __.errors.start.length !== 0)
            return { success: false, errors: __.errors };

        let orderedBlocks = await orderBlocks({ start: __.start, blocks: __.blocks });
        return { success: true, blocks: orderedBlocks };
    }

    const orderBlocks = ({ blocks, start }) => {
        return new Promise((resolve) => {
            let orderedBlocks = [];
            let iterateBlocks = (block_id) => {
                let block_data = blocks.find(n => n.block.block_id === block_id);
                if (!block_data)
                    resolve(orderedBlocks)
                orderedBlocks.push(block_data.block);
                let next_block_id = block_data.next_block_id;
                if (next_block_id)
                    iterateBlocks(next_block_id);
                else
                    resolve(orderedBlocks);

            }
            iterateBlocks(start);
        })
    }

    const getAllInstructionsRole = ({ blocks, instructions, role_id }) => {
        //console.log(blocks, instructions, role_id);
        return blocks.map(block =>
            block.instructions.filter(instruction_id =>
                instructions[instruction_id].role_id === role_id)
        ).flat()
    }
}

