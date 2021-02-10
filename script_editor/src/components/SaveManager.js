class SaveManager {
    async process(_nodes, _roles) {
        this.nodes = [..._nodes];
        this.roles = _roles;
        let instructions = [];
        // update instruction_order_node per node
        this.nodes = this.nodes.map(node => {
            node.instructions = this.updateInstructionOrder(node.instructions, 'node');
            return node;
        })
        // process sequence of instructions per role
        for (let role of _roles) {
            let r_instructions = await this.processRole(role);
            instructions.push(r_instructions);
        }
        instructions = instructions.flat();
        instructions.sort((a, b) => a.role_id > b.role_id || a.instruction_order_role > b.instruction_order_role);
        // remove instructions from nodes
        console.log(this.nodes);
        let nodes = this.nodes.map(node => {
            node = { ...node };
            node.instructions = node.instructions.map(v => v.instruction_id);
            node.connections = node.connections.map(v => {
                return {
                    role_id: v.role_id,
                    next_node_id: v.next_node_id,
                    prev_node_id: v.prev_node_id
                }
            });
            console.log(node, node.connections);

            console.log("node.instructions", node.instructions);
            return node;
        })

        return { instructions, nodes };
    }

    orderNodes = (data) => {
        return new Promise((resolve) => {
            var orderedNodes = [];
            let iterateNodes = (node_id) => {
                let node_data = data.nodes.find(n => n.node.node_id === node_id);
                if (!node_data) { resolve(orderedNodes) };
                orderedNodes.push(node_data.node);
                let next_node_id = node_data.next_node_id;
                if (next_node_id) {
                    iterateNodes(next_node_id);
                } else {
                    resolve(orderedNodes);
                }
            }
            iterateNodes(data.start);
        })
    }

    async getOrderedNodesRole(_role_id) {

        let data = {
            start: null,
            end: null,
            nodes: [],
            errors: {}
        };

        const addError = (type, node_id) => {
            if (type in data.errors)
                data.errors[type].push(node_id)
            else {
                data.errors[type] = [data[type], node_id];
                data[type] = null;
            }
        }

        this.nodes.forEach(node => {
            // check if node has connection with this role_id
            let connection = node.connections.find(c => c.role_id === _role_id);
            if (!connection) return;
            //console.log(node);
            let c_data = {
                node: node,
                prev_node_id: connection.prev_node_id,
                next_node_id: connection.next_node_id
            }
            data.nodes.push(c_data);
            // check if multiple entry / exit points of role
            if (!connection.prev_node_id)
                !data.start ? data.start = node.node_id : addError('start', node.node_id);
            if (!connection.next_node_id)
                !data.end ? data.end = node.node_id : addError('end', node.node_id);
        })
        if (Object.keys(data.errors).length !== 0) return { sucess: false, errors: data.errors };
        let nodes = await this.orderNodes(data);
        return { success: true, nodes: nodes };
    }

    updateNextInstructionId(_nodes) {
        return _nodes.map(node => {
            node.instructions.map((instruction, i) => {
                let lastInstruction = i === (node.instructions.length - 1);
                if (!lastInstruction) {
                    // add next instruction_id of node
                    //console.log()
                    if (node.instructions[i + 1].role_id != instruction.role_id) {
                        instruction.next_instruction_id = node.instructions[i + 1].instruction_id;
                    } else {
                        instruction.next_instruction_id = null;
                    }
                } else {
                    // find to which nodes node is connected and push the first instruction
                    let next_instruction_ids = node.connections.filter(connection => {
                        if ('next_node_id' in connection && connection.next_node_id) {
                            // dont include them if they r from the same role_id
                            //console.log(connection.next_node_id, this.nodes);
                            let next_role_id = this.nodes.find(v => v.node_id === connection.next_node_id).instructions[0].role_id;
                            return next_role_id && next_role_id !== instruction.role_id ? true : false;
                        }
                        return false;
                    }).map((connection) => {
                        let next_node_id = connection.next_node_id;
                        let nextNode = this.nodes.find(n => n.node_id === next_node_id);
                        if (!nextNode) console.error('errrr', next_node_id)

                        let instructions = nextNode.instructions;
                        if (instructions.length > 0)
                            return instructions[0].instruction_id;
                    });
                    instruction.next_instruction_id = next_instruction_ids.length > 0 ? next_instruction_ids.join(', ') : null;

                }
                return instruction;
            })
            return node;
        })
    }

    updatePrevInstructionId(_nodes, allNodes) {
        console.log(_nodes);
        return _nodes.map(node => {
            node.instructions.map((instruction, i) => {
                let lastInstruction = i === 0;
                if (!lastInstruction) {
                    // add next instruction_id of node
                    instruction.prev_instruction_id = node.instructions[i - 1].instruction_id;

                    if (node.instructions[i - 1].role_id != instruction.role_id) {
                        instruction.prev_instruction_id = node.instructions[i - 1].instruction_id;
                    } else {
                        instruction.prev_instruction_id = null;
                    }

                } else {
                    //console.log(_nodes);
                    // find to which nodes node is connected and push the first instruction
                    let prev_instruction_ids = node.connections.filter(connection => {
                        // 'prev_node_id' in connection && connection.prev_node_id && connection.prev_node_id != node.node_id
                        if ('prev_node_id' in connection && connection.prev_node_id) {
                            // dont include them if they r from the same role_id
                            let prev_node = this.nodes.find(v => v.node_id === connection.prev_node_id);
                            if (!prev_node) { console.error('errrrrr', connection.prev_node_id); };
                            let prev_instructions = prev_node.instructions
                            //console.log(prev_instructions, connection);
                            if (prev_instructions.length > 0) {
                                if (!instruction.role_id) {
                                    //console.log('NO ROLE ID', instruction.role_id, instruction);
                                }
                                let prev_role_id = prev_instructions[(prev_instructions.length - 1)].role_id;
                                return prev_role_id !== instruction.role_id ? true : false;
                                // return true;
                            } else {
                                //console.log('empty box', prev_node);
                                return false;
                            }

                        }
                        console.log("THIS HAPPENS?");
                        return false;
                    }).map((connection) => {
                        let prev_node_id = connection.prev_node_id;
                        if (!prev_node_id) return;
                        let instructions = this.nodes.find(n => n.node_id === prev_node_id).instructions;
                        if (instructions.length > 0)
                            return instructions[0].instruction_id;
                    });

                    instruction.prev_instruction_id = prev_instruction_ids.length > 0 ? prev_instruction_ids.join(', ') : null;
                }
            })
            return node;
        })
    }

    getAllInstructionsRole(r_nodes, role_id) {
        // create array of arrays of instructions
        let r_instructions = r_nodes.map(node => {
            let instructions = node.instructions.filter(instruction => instruction.role_id === role_id);
            return instructions;
        });
        // flatten array of array
        r_instructions = r_instructions.flat();
        //console.log('getAllInstructionsRole', r_nodes, r_instructions)

        return r_instructions;
    }

    updateInstructionOrder = (instructions, type) => {
        //console.log(instructions, type);
        return instructions.map((instruction, i) => {
            instruction[`instruction_order_${type}`] = i;
            return instruction;
        })
    }


    async processRole(_role) {
        // get nodes of the role
        let r_nodes = await this.getOrderedNodesRole(_role.role_id);
        if (!r_nodes.success)
            console.error(r_nodes.errors);
        // add next_instruction_id to each instruction;
        r_nodes = this.updateNextInstructionId(r_nodes.nodes);
        r_nodes = this.updatePrevInstructionId(r_nodes);

        // create sequence of all instructions of one role
        let instructions = this.getAllInstructionsRole(r_nodes, _role.role_id, this.nodes);
        return this.updateInstructionOrder(instructions, 'role');
        // update instruction_order


    }

}

export default SaveManager