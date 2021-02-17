export default function DataProcessor() {
    let _data = {
        blocks: null,
        instructions: null,
        roles: null
    }


    this.process = async () => {
        this.save = async ({ blocks, instructions, roles }) => {
            /*             _data = {
                            blocks, instructions, roles
                        } */

            let _roles = {};
            let errors = [];

            // process sequence of instructions per role
            for (let role of this.roles) {
                let r_instructions = await processRole({ role, blocks });
                if (!r_instructions.success) errors.push(r_instructions);
                _roles[role.role_id] = r_instructions.instructions;
            }

            if (errors.length !== 0) {
                let _confirm = window.confirm('there are multiple entry points. this script will not be playable. do you still want to save?');
                if (!_confirm) {
                    return { success: false };
                }
            } else {
                processInstructions();
            }

            return { success: true, roles: _roles, instructions: instructions, blocks: blocks }
        }

    }

    const processInstructions = ({ blocks, instructions }) => {
        const processLastInstruction = ({ block, role, instruction, count }) => {
            let connection = block.connections.find(v => v.role_id === role);
            let next_block_id = connection.next_block_id;

            if (!!next_block_id) {
                let connected_block = blocks.find(v => v.block_id === next_block_id);
                let first_instr_from_conn_block = connected_block.instructions[0];
                instructions[instruction].next_instruction_id = first_instr_from_conn_block;
            } else {
                instructions.next_instruction_id = null;
            }

        }
        const processFirstInstruction = ({ block, role, instruction, count }) => {
            instructions[instruction].prev_instruction_id = [];
            block.connections.forEach((connection) => {
                let prev_block_id = connection.prev_block_id;
                // console.log(connection, block.block_id);
                if (!!prev_block_id) {
                    let connected_block = blocks.find(v => v.block_id === prev_block_id);
                    let last_instr_from_conn_block = connected_block.instructions[connected_block.instructions.length - 1];
                    instructions[instruction].prev_instruction_id.push(last_instr_from_conn_block);
                }
                // console.log(instructions[instruction].prev_instruction_id, instruction);
            })
        }
        const getNextInBlock = ({ block, role, instruction, count }) => {
            instructions[instruction].next_instruction_id = block.instructions[count + 1]
        }
        const getPrevInBlock = ({ block, role, instruction, count }) => {
            instructions[instruction].prev_instruction_id = [block.instructions[count - 1]]
        }

        for (let block of blocks) {
            // 2 edge cases: first and last
            //console.log(block);
            let count = 0;

            for (let instruction of block.instructions) {
                let role = instructions[instruction].role_id;
                //console.log(block, count);

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

    this.processRoles = ({ roles, blocks, instructions }) => {
        roles.forEach(role => {
            processRole({ role, blocks, instructions });
        })
    }

    const processRole = async ({ role, blocks, instructions }) => {
        const getOrderedBlocksRole = async (role_id) => {
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
                    !__.start ?
                        __.start = block.block_id :
                        __.errors.start.push(block.block_id);
                if (!connection.next_block_id)
                    !__.end ?
                        __.end = block.block_id :
                        __.errors.end.push(block.block_id);

            })
            if (Object.keys(__.errors).length !== 0) return { sucess: false, errors: __.errors };
            let orderedBlocks = await orderBlocks({ start: __.start, blocks: __.blocks });
            return { success: true, blocks: orderedBlocks };
        }
        const getAllInstructionsRole = (r_blocks, role_id) => {
            // create array of arrays of instructions
            let r_instructions = r_blocks.map(block => {
                let instructions = block.instructions.filter(id => instructions[id].role_id === role_id);
                // instructions = instructions.filter(v => v.instruction_id);
                return instructions;
            });
            // flatten array of array
            r_instructions = r_instructions.flat();
            return r_instructions;
        }

        let r_blocks = await getOrderedBlocksRole(role.role_id);
        if (!r_blocks.success)
            return r_blocks;
        let instructions = getAllInstructionsRole(r_blocks.blocks, role.role_id, blocks);
        return { success: true, instructions: instructions }
    }
}

