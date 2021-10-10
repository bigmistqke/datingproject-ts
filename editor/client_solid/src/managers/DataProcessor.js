import { createSignal, createEffect, onMount, For } from 'solid-js';


export default function DataProcessor({ blockManager }) {

    this.checkConnections = async ({ blocks, roles }) => {
        let _errors = {};
        // process sequence of instructions per role
        for (let role_id of roles) {

            let check = await getOrderedBlocksRole({ blocks: blocks, role_id: role_id });
            // let r_blocks = await getOrderedBlocksRole({ blocks: blocks, role_id: role_id });
            if (!check.success) {
                for (let direction in check.errors) {
                    for (let block_id of check.errors[direction]) {
                        if (!(block_id in _errors))
                            _errors[block_id] = {};
                        !(_errors[block_id][direction]) ?
                            _errors[block_id][direction] = [role_id] :
                            _errors[block_id][direction] = [role_id, ..._errors[block_id][direction]];
                    }

                }
            }
        }
        return { success: Object.values(_errors).length === 0, errors: _errors }
    }


    this.process = async ({ roles, blocks, instructions, safe }) => {
        for (let instruction_id in instructions) {
            let isClean = blocks.find(block => block.instructions.includes(instruction_id));
            if (!!!isClean) {
                console.error('found an instruction that is not a part of a block:', instruction_id, blocks);
                delete instructions[instruction_id];
            }
        }
        //console.log('process ', roles);
        ////console.log('pre-processed roles: ', roles);
        var { roles, errors } = await processRoles({ roles, blocks, instructions });
        ////console.log('processed roles: ', roles);
        if (Object.values(errors).filter(e => e.length !== 0).length != 0) {
            Object.entries(errors).forEach(([role_id, value]) => {
                errors[role_id].start.forEach((block_id) => {
                    //console.log(role_id, blocks.filter(b => b.block_id === block_id));
                })
                errors[role_id].end.forEach((block_id) => {
                    //console.log(role_id, blocks.filter(b => b.block_id === block_id));
                })
            })

            //console.log('has errorrrs!', errors);
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

        blocks = blocks.map(block => {
            let keys = ['block_id', 'instructions', 'connections', 'position'];
            return Object.fromEntries(Object.entries(block).filter(([key, value]) =>
                keys.includes(key)
            ))
        })

        var { blocks, instructions } = processInstructions({ blocks, instructions });
        return {
            success: true,
            roles,
            error,
            instructions, blocks
        }
    }

    const processRoles = async ({ roles, blocks, instructions }) => {
        console.log(roles, blocks, instructions);

        let _roles = {};
        let _errors = {};
        for (let role_id of roles) {
            let r_blocks = await getOrderedBlocksRole({ blocks: blocks, role_id: role_id });
            console.log('process roles ', r_blocks, role_id);
            if (!r_blocks.success) {
                _errors[role_id] = r_blocks.errors
                _roles[role_id] = false
            } else {
                let _instructions = getAllInstructionsRole({ blocks: r_blocks.blocks, instructions: instructions, role_id: role_id });
                _roles[role_id] = _instructions;
            }
        }
        ////console.log(`roles:`, _roles);
        return { roles: _roles, errors: _errors }
    }

    const processInstructions = ({ blocks, instructions }) => {
        const processLastInstruction = ({ block, role, instruction_id, count }) => {
            ////console.log(block, role);
            let connection = block.ports.find(v => {
                return v.role_id == role
            });

            if (!connection) {
                console.error('no connections!');
            }



            instructions[instruction_id].next_role_ids = [];

            block.ports.forEach((connection) => {
                ////console.log(connection);
                let next_block_id = connection.next_block_id;
                if (!!next_block_id) {
                    let connected_block = blocks.find(v => v.block_id === next_block_id);
                    let next_instruction_id = connected_block.instructions[0];
                    let next_role_id = instructions[next_instruction_id].role_id;
                    instructions[instruction_id].next_role_ids.push(next_role_id);
                }
            })
        }
        const processFirstInstruction = ({ block, role, instruction_id }) => {
            instructions[instruction_id].prev_instruction_ids = [];
            block.ports.forEach((connection) => {
                let prev_block_id = connection.prev_block_id;
                if (!!prev_block_id) {
                    let connected_block = blocks.find(v => v.block_id === prev_block_id);
                    let prev_instruction_id = connected_block.instructions[connected_block.instructions.length - 1];
                    ////console.log(instructions[instruction].prev_instruction_ids, prev_instruction_id);
                    if (instructions[instruction_id].prev_instruction_ids.indexOf(prev_instruction_id) == -1) {
                        instructions[instruction_id].prev_instruction_ids.push(prev_instruction_id);
                    };
                }
            })
        }
        const getNextInBlock = ({ block, role, instruction_id, count }) => {
            instructions[instruction_id].next_role_ids = [instructions[block.instructions[count + 1]].role_id]
        }
        const getPrevInBlock = ({ block, role, instruction_id, count }) => {
            instructions[instruction_id].prev_instruction_ids = [String(block.instructions[count - 1])]
        }

        for (let block of blocks) {

            let count = 0;

            for (let instruction_id of block.instructions) {
                let role = instructions[instruction_id].role_id;

                console.log(instructions[instruction_id]);

                let keys = ['instruction_id', 'text', 'type', 'role_id', 'timespan', 'sound']
                instructions[instruction_id] = Object.fromEntries(Object.entries(instructions[instruction_id]).filter(([key, value]) =>
                    keys.includes(key)
                ))
                instructions[instruction_id].prev_instruction_ids = [];
                instructions[instruction_id].next_role_ids = [];
                // ////console.log(instructions[instruction]);

                if (count === 0) {
                    processFirstInstruction({ block, role, instruction_id, count })
                    if (1 !== block.instructions.length) {
                        getNextInBlock({ block, role, instruction_id, count: 0 });
                    }
                }
                if (count === block.instructions.length - 1) {
                    processLastInstruction({ block, role, instruction_id, count })
                    if (1 !== block.instructions.length) {
                        getPrevInBlock({ block, role, instruction_id, count: count });
                    }
                }
                if (count !== 0 && count !== block.instructions.length - 1) {
                    getPrevInBlock({ block, role, instruction_id, count: count });
                    getNextInBlock({ block, role, instruction_id, count: count });
                }
                count++
            }
        }

        //console.log('instructions : ', instructions);

        return { blocks, instructions }
    }

    const getOrderedBlocksRole = async ({ blocks, role_id }) => {
        let result = {
            start: null,
            end: null,
            blocks: [],
            errors: { start: [], end: [] }
        };
        blocks.forEach(block => {
            // check if block has connection with this role_id
            let connection = block.ports.find(c => c.role_id === role_id);
            if (!connection) return;

            result.blocks.push({
                block: block,
                prev_block_id: connection.prev_block_id,
                next_block_id: connection.next_block_id
            });
            // check if multiple entry / exit points of role
            if (!connection.prev_block_id)
                // check if there is no start of the role yet
                !result.start ?
                    result.start = block.block_id :
                    // else error
                    result.errors.start.length === 0 ?
                        result.errors.start = [result.start, block.block_id] :
                        result.errors.start = [block.block_id, ...result.errors.start];

            if (!connection.next_block_id)
                !result.end ?
                    result.end = block.block_id :
                    result.errors.end.length === 0 ?
                        result.errors.end = [result.end, block.block_id] :
                        result.errors.end = [block.block_id, ...result.errors.end];

        })
        if (result.errors.end.length !== 0 || result.errors.start.length !== 0)
            return { success: false, errors: result.errors };

        let orderedBlocks = await orderBlocks({ start: result.start, blocks: result.blocks });
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
        return blocks.map(block =>
            block.instructions.filter(instruction_id =>
                instructions[instruction_id].role_id == role_id)
        ).flat()
    }
}

