import { createSignal, createEffect, onMount, For } from 'solid-js';

//  functionality of DataProcessor:
//      1. quality control: check if editorState produces a playable game
//          a. check for 'dirty' state: 
//              p.ex instruction_ids in block.instructions which is not present in instructions or vice versa
//          b. multiple open start/end-blocks for role
//          c. infinite loops
//      2. generate playState = sequence of instructions per role


export default function DataProcessor({ scriptState, setEditorState }) {

    // INTERNALS

    this.traverseRole = ({ role_id, block_id }) => new Promise((resolve, reject) => {

        if (!block_id) {
            console.error("ERROR: block_id is incorrect");
            return;
        }

        let traversed_block_ids = [];
        function iterateRole(block_id) {

            if (traversed_block_ids.indexOf(block_id) != -1) {
                resolve({
                    success: false,
                    traversed_block_ids,
                    error: {
                        type: 'infinite_loop',
                        text: `found an infinite loop for role ${role_id}.`,
                        block_ids: traversed_block_ids
                    }
                });
                return;
            }
            traversed_block_ids.push(block_id);
            let next_block_id = scriptState.blocks[block_id].roles[role_id].next_block_id;
            if (!next_block_id) {
                resolve({
                    success: true,
                    traversed_block_ids
                });
            } else {
                iterateRole(next_block_id)
            }
        }
        iterateRole(block_id);
    })

    const dedupArray = (array) => {
        let seen = {};
        let duplicates = {};
        array = array.filter(function (item) {
            if (seen.hasOwnProperty(item)) {
                duplicates[item] = true;
                return false;
            }
            seen[item] = true
            return true;
        });

        return [array, Object.keys(duplicates)]
    }

    // METHODS

    this.controlRole = async (role_id) => {
        let start = performance.now();
        let instruction_ids = [];
        let errors = [];
        // get blocks per role
        let blocks = Object.entries(scriptState.blocks).filter(
            ([block_id, block]) => {
                return Object.keys(block.roles).indexOf(role_id) !== -1
            });
        let block_ids = blocks.map(([block_id, block]) => block_id);


        // test #1 check for multiple open start/end-blocks for role
        let start_block_ids = blocks.filter(([block_id, block]) => {
            return !("prev_block_id" in block.roles[role_id])
        }
        ).map(([block_id, block]) => block_id);

        let end_block_ids = blocks.filter(([block_id, block]) => {
            return !("next_block_id" in block.roles[role_id])
        }).map(([block_id, block]) => block_id);

        let start_end_block_ids = [...start_block_ids, ...end_block_ids];
        [start_end_block_ids] = dedupArray(start_end_block_ids);

        if (start_block_ids.length > 1 || end_block_ids.length > 1) {
            errors.push({
                type: 'multiple_open_start_ports',
                text: `more then 2 possible starts for role ${role_id}`,
                block_ids: start_end_block_ids
            })
        }

        // test #2 look for infinite-loops by recursively iterating
        // through the start_blocks

        let promises = [];
        promises = start_block_ids.map((block_id) => this.traverseRole({ role_id, block_id }))
        let results = await Promise.all(promises);

        results.forEach(result => { if (!result.success) errors.push(result.error) })

        let total_traversed_block_ids = [].concat.apply([], results.map(result => result.traversed_block_ids));

        if (total_traversed_block_ids.length != block_ids.length) {
            // this can indicate
            //      a. that there are infinite_loops which are not accessible from start/end-blocks
            //      b. that there are block_ids which are connected to multiple start/end-blocks

            let [deduped_block_ids, duplicate_block_ids] = dedupArray(total_traversed_block_ids);

            if (deduped_block_ids.length !== total_traversed_block_ids.length) {
                console.error("block_ids were accessed via multiple start/end-blocks, most likely indicating a bug in the editor");
                errors.push({
                    type: 'multiple_traversed_block_ids',
                    text: `blocks were accessed multiple times for role ${role_id}, most likely indicating a bug in the editor`,
                    block_ids: duplicate_block_ids
                })
            }
            total_traversed_block_ids = deduped_block_ids;

            let unaccessible_block_ids = block_ids.filter(block_id =>
                total_traversed_block_ids.indexOf(block_id) === -1
            )

            if (unaccessible_block_ids.length > 0) {
                const traverseAllUnaccessibleBlocks = () => new Promise((resolve) => {
                    let results = [];
                    let traverseRoleFromUnaccessibleBlockId = async (block_id) => {
                        let result = await this.traverseRole({ role_id, block_id })
                        results.push(result);
                        /* if (!result.succes) {
                            errors.push(result.error);
                        } */
                        unaccessible_block_ids = unaccessible_block_ids.filter(block_id =>
                            result.traversed_block_ids.indexOf(block_id) === -1
                        );
                        if (unaccessible_block_ids.length === 0) {
                            resolve(results);
                        } else {
                            traverseRoleFromUnaccessibleBlockId(unaccessible_block_ids[0])
                        }
                    }
                    traverseRoleFromUnaccessibleBlockId(unaccessible_block_ids[0])
                })

                let results = await traverseAllUnaccessibleBlocks();
                results.forEach(result => {
                    if (!result.success) {
                        errors.push(result.error)
                    }
                    else {
                        console.error("ERROR: unaccessible blocks should not be able to traverse successfully");
                    }
                })
            }
        }

        console.info("control of role took: ", performance.now() - start, "ms");
        console.info("total errors of role", role_id, "after control ", errors);
        return errors.length == 0 ?
            {
                success: true,
                block_ids: total_traversed_block_ids
            } :
            {
                success: false,
                errors
            }
    }
    this.control = async () => {
        let roles = scriptState["roles"];
        let results = {};
        for (let role_id of Object.keys(roles)) {
            results[role_id] = await this.controlRole(role_id)
        }
        return results;
    }

    this.getEndBlock = async ({ block_id, role_id }) => {
        let { traversed_block_ids } = await this.traverseRole({ block_id, role_id });
        return traversed_block_ids[traversed_block_ids.length - 1]
    }

    const processInstructions = () => {
        const getNextRoleIdsOfLast = (block) => {
            let next_role_ids = [];
            Object.values(block.roles).forEach((role) => {
                if (!role.next_block_id) return
                let connected_block = scriptState.blocks[role.next_block_id];
                let next_instruction_id = connected_block.instructions[0];
                if (next_role_ids.indexOf(instructions[next_instruction_id].role_id) == -1) return;
                next_role_ids.push(instructions[next_instruction_id].role_id);
            })
            return next_role_ids;
        }
        const getPrevInstructionIdsOfFirst = (block) => {
            let prev_instruction_ids = [];
            Object.values(block.roles).forEach((role) => {
                if (!role.prev_block_id) return;
                let connected_block = scriptState.blocks[role.prev_block_id];
                let prev_instruction_id = connected_block.instructions[connected_block.instructions.length - 1];
                if (prev_instruction_ids.indexOf(instructions[prev_instruction_id].role_id) == -1) return;
                prev_instruction_ids.push(prev_instruction_id);
            })
            return prev_instruction_ids
        }
        const getNextRoleIds = ({ block, count }) => [instructions[block.instructions[count + 1]].role_id]
        const getPrevInstructionIds = ({ block, count }) => [String(block.instructions[count - 1])]

        let instructions = { ...scriptState.instructions };

        for (let block_id in scriptState.blocks) {
            let block = scriptState.blocks[block_id];
            let count = 0;
            for (let instruction_id of block.instructions) {
                instructions[instruction_id] = { ...instructions[instruction_id] };
                instructions[instruction_id].prev_instruction_ids = [];
                instructions[instruction_id].next_role_ids = [];
                // if instruction is the first
                if (count === 0) {
                    instructions[instruction_id].prev_instruction_ids =
                        getPrevInstructionIdsOfFirst(block);

                    if (1 !== block.instructions.length) {
                        instructions[instruction_id].next_role_ids =
                            getNextRoleIds({ block, count });
                    }
                }
                // if instruction is the last
                if (count === block.instructions.length - 1) {
                    instructions[instruction_id].next_role_ids =
                        getNextRoleIdsOfLast(block);

                    if (1 !== block.instructions.length) {
                        instructions[instruction_id].prev_instruction_ids =
                            getPrevInstructionIds({ block, count });
                    }
                }
                // in all other occasions
                if (count !== 0 && count !== block.instructions.length - 1) {
                    instructions[instruction_id].next_role_ids = getNextRoleIds({ block, count });
                    instructions[instruction_id].prev_instruction_ids = getPrevInstructionIds({ block, count });
                }
                count++
            }
        }
        return instructions
    }



    this.process = async () => {
        let results = await this.control();
        if (Object.values(results).find(result => !result.success)) return { success: false };
        let roles = { ...scriptState["roles"] };

        Object.entries(roles).forEach(([role_id, role]) => {
            roles[role_id] = { ...role };

            let instruction_ids = [];
            roles[role_id].instruction_ids = [];
            results[role_id].block_ids.forEach(block_id =>
                scriptState["blocks"][block_id].instructions.forEach(instruction_id => {

                    if (!scriptState["instructions"][instruction_id]) {
                        console.error('instruction ', instruction_id, 'does not exist');
                        return;
                    }
                    if (scriptState["instructions"][instruction_id].role_id === role_id) {
                        instruction_ids.push(instruction_id);
                    }
                })
            )
            roles[role_id].instruction_ids = instruction_ids;
        })

        let instructions = processInstructions();

        return {
            success: true,
            roles,
            instructions
        }
    }
}

