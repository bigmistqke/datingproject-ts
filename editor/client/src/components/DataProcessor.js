export default class DataProcessor {



    async process({ blocks, instructions, roles }) {
        this.blocks = blocks;
        this.roles = roles;
        this.instructions = instructions;

        let _roles = {};
        let errors = [];

        // process sequence of instructions per role
        for (let role of this.roles) {
            let r_instructions = await this.processRole(role);

            if (!r_instructions.success) errors.push(r_instructions);
            //console.log("r_instructions.instructions", r_instructions.instructions);
            _roles[role.role_id] = r_instructions.instructions;
        }

        if (errors.length !== 0) {
            let _confirm = window.confirm('there are multiple entry points. this script will not be playable. do you still want to save?');
            if (!_confirm) {
                return { success: false };
            }
        } else {
            this.processInstructions();
        }

        return { success: true, roles: _roles, instructions: this.instructions, blocks: this.blocks }
    }

    processInstructions() {
        const processLastInstruction = ({ block, role, instruction, count }) => {
            let connection = block.connections.find(v => v.role_id === role);
            let next_block_id = connection.next_block_id;

            if (!!next_block_id) {
                let connected_block = this.blocks.find(v => v.block_id === next_block_id);
                let first_instr_from_conn_block = connected_block.instructions[0];
                this.instructions[instruction].next_instruction_id = first_instr_from_conn_block;
            } else {
                this.instructions.next_instruction_id = null;
            }

        }
        const processFirstInstruction = ({ block, role, instruction, count }) => {
            this.instructions[instruction].prev_instruction_id = [];
            block.connections.forEach((connection) => {
                let prev_block_id = connection.prev_block_id;
                // console.log(connection, block.block_id);
                if (!!prev_block_id) {
                    let connected_block = this.blocks.find(v => v.block_id === prev_block_id);
                    let last_instr_from_conn_block = connected_block.instructions[connected_block.instructions.length - 1];
                    this.instructions[instruction].prev_instruction_id.push(last_instr_from_conn_block);
                }
                // console.log(this.instructions[instruction].prev_instruction_id, instruction);
            })
        }
        const getNextInBlock = ({ block, role, instruction, count }) => {
            this.instructions[instruction].next_instruction_id = block.instructions[count + 1]
        }

        const getPrevInBlock = ({ block, role, instruction, count }) => {
            this.instructions[instruction].prev_instruction_id = [block.instructions[count - 1]]
        }
        for (let block of this.blocks) {
            // 2 edge cases: first and last
            //console.log(block);
            let count = 0;

            for (let instruction of block.instructions) {
                let role = this.instructions[instruction].role_id;
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
    }

    orderBlocks = (data) => {
        return new Promise((resolve) => {
            var orderedBlocks = [];
            let iterateBlocks = (block_id) => {
                let block_data = data.blocks.find(n => n.block.block_id === block_id);
                if (!block_data) { resolve(orderedBlocks) };
                orderedBlocks.push(block_data.block);
                let next_block_id = block_data.next_block_id;
                if (next_block_id) {
                    iterateBlocks(next_block_id);
                } else {
                    resolve(orderedBlocks);
                }
            }
            iterateBlocks(data.start);
        })
    }

    async getOrderedBlocksRole(_role_id) {

        let data = {
            start: null,
            end: null,
            blocks: [],
            errors: {}
        };

        const addError = (type, block_id) => {
            if (type in data.errors)
                data.errors[type].push(block_id)
            else {
                data.errors[type] = [data[type], block_id];
                data[type] = null;
            }
        }

        this.blocks.forEach(block => {
            // check if block has connection with this role_id
            let connection = block.connections.find(c => c.role_id === _role_id);
            if (!connection) return;
            //////console.log(block);
            let c_data = {
                block: block,
                prev_block_id: connection.prev_block_id,
                next_block_id: connection.next_block_id
            }
            data.blocks.push(c_data);
            // check if multiple entry / exit points of role
            if (!connection.prev_block_id)
                !data.start ? data.start = block.block_id : addError('start', block.block_id);
            if (!connection.next_block_id)
                !data.end ? data.end = block.block_id : addError('end', block.block_id);
        })
        if (Object.keys(data.errors).length !== 0) return { sucess: false, errors: data.errors };
        let blocks = await this.orderBlocks(data);
        return { success: true, blocks: blocks };
    }

    updateNextInstructionId(_blocks) {
        return _blocks.map(block => {
            block.instructions.map((instruction, i) => {
                let lastInstruction = i === (block.instructions.length - 1);
                if (!lastInstruction) {
                    // add next instruction_id of block
                    //////console.log()
                    if (block.instructions[i + 1].role_id != instruction.role_id) {
                        instruction.next_instruction_id = block.instructions[i + 1].instruction_id;
                    } else {
                        instruction.next_instruction_id = null;
                    }
                } else {
                    // find to which blocks block is connected and push the first instruction
                    let next_instruction_ids = block.connections.filter(connection => {
                        if ('next_block_id' in connection && connection.next_block_id) {
                            // dont include them if they r from the same role_id
                            //////console.log(connection.next_block_id, this.blocks);
                            let next_role_id = this.blocks.find(v => v.block_id === connection.next_block_id).instructions[0].role_id;
                            return next_role_id && next_role_id !== instruction.role_id ? true : false;
                        }
                        return false;
                    }).map((connection) => {
                        let next_block_id = connection.next_block_id;
                        let nextBlock = this.blocks.find(n => n.block_id === next_block_id);
                        if (!nextBlock) console.error('errrr', next_block_id)

                        let instructions = nextBlock.instructions;
                        if (instructions.length > 0)
                            return instructions[0].instruction_id;
                    });
                    instruction.next_instruction_id = next_instruction_ids.length > 0 ? next_instruction_ids.join(', ') : null;

                }
                return instruction;
            })
            return block;
        })
    }

    updatePrevInstructionId(_blocks, allBlocks) {
        ////console.log(_blocks);
        return _blocks.map(block => {
            block.instructions.map((instruction, i) => {
                let lastInstruction = i === 0;
                if (!lastInstruction) {
                    // add next instruction_id of block
                    instruction.prev_instruction_id = block.instructions[i - 1].instruction_id;

                    if (block.instructions[i - 1].role_id != instruction.role_id) {
                        instruction.prev_instruction_id = block.instructions[i - 1].instruction_id;
                    } else {
                        instruction.prev_instruction_id = null;
                    }

                } else {
                    //////console.log(_blocks);
                    // find to which blocks block is connected and push the first instruction
                    let prev_instruction_ids = block.connections.filter(connection => {
                        // 'prev_block_id' in connection && connection.prev_block_id && connection.prev_block_id != block.block_id
                        if ('prev_block_id' in connection && connection.prev_block_id) {
                            // dont include them if they r from the same role_id
                            let prev_block = this.blocks.find(v => v.block_id === connection.prev_block_id);
                            if (!prev_block) { console.error('errrrrr', connection.prev_block_id); };
                            let prev_instructions = prev_block.instructions
                            //////console.log(prev_instructions, connection);
                            if (prev_instructions.length > 0) {
                                if (!instruction.role_id) {
                                    //////console.log('NO ROLE ID', instruction.role_id, instruction);
                                }
                                let prev_role_id = prev_instructions[(prev_instructions.length - 1)].role_id;
                                return prev_role_id !== instruction.role_id ? true : false;
                                // return true;
                            } else {
                                //////console.log('empty box', prev_block);
                                return false;
                            }

                        }
                        ////console.log("THIS HAPPENS?");
                        return false;
                    }).map((connection) => {
                        let prev_block_id = connection.prev_block_id;
                        if (!prev_block_id) return;
                        let instructions = this.blocks.find(n => n.block_id === prev_block_id).instructions;
                        if (instructions.length > 0)
                            return instructions[0].instruction_id;
                    });

                    instruction.prev_instruction_id = prev_instruction_ids.length > 0 ? prev_instruction_ids.join(', ') : null;
                }
            })
            return block;
        })
    }

    getAllInstructionsRole(r_blocks, role_id) {
        // create array of arrays of instructions
        let r_instructions = r_blocks.map(block => {
            let instructions = block.instructions.filter(id => this.instructions[id].role_id === role_id);
            // instructions = instructions.filter(v => v.instruction_id);
            return instructions;
        });
        // flatten array of array
        r_instructions = r_instructions.flat();
        //////console.log('getAllInstructionsRole', r_blocks, r_instructions)

        return r_instructions;
    }

    updateInstructionOrder = (instructions, type) => {
        //////console.log(instructions, type);

        return instructions.map((instruction, i) => {
            instruction[`instruction_order_${type}`] = i;
            return instruction;
        })
    }


    async processRole(_role) {
        let r_blocks = await this.getOrderedBlocksRole(_role.role_id);
        if (!r_blocks.success)
            return r_blocks;
        let instructions = this.getAllInstructionsRole(r_blocks.blocks, _role.role_id, this.blocks);
        return { success: true, instructions: instructions }
    }
}

