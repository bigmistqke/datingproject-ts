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

    const traverseRole = ({ role_id, block_id }) => new Promise((resolve, reject) => {

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
        // return
        let errors = [];
        // get blocks per role
        let blocks = Object.entries(scriptState.blocks).filter(
            ([block_id, block]) => Object.keys(block.roles).indexOf(role_id) !== -1);
        let block_ids = blocks.map(([block_id, block]) => block_id);

        // test #1 check for multiple open start/end-blocks for role
        let start_block_ids = blocks.filter(([block_id, block]) =>
            !block.roles[role_id].prev_block_id
        ).map(([block_id, block]) => block_id);

        let end_block_ids = blocks.filter(([block_id, block]) =>
            !block.roles[role_id].next_block_id
        ).map(([block_id, block]) => block_id);

        let start_end_block_ids = [...start_block_ids, ...end_block_ids];
        [start_end_block_ids] = dedupArray(start_end_block_ids)

        if (start_end_block_ids.length > 2) {
            errors.push({
                type: 'multiple_open_ports',
                text: `more then 2 possible starts/ends for role ${role_id}`,
                block_ids: start_end_block_ids
            })
        }

        // test #2 look for infinite-loops by recursively iterating
        // through the start_blocks

        let loops = [];

        let promises = [];

        promises = start_block_ids.map((block_id) => traverseRole({ role_id, block_id }))

        let results = await Promise.all(promises);
        results.forEach(result => { if (!result.success) errors.push(result.error) })

        let total_traversed_block_ids = [].concat.apply([], results.map(result => result.traversed_block_ids));

        if (total_traversed_block_ids.length != block_ids.length) {
            // this can indicate
            //      a. that there are infinite_loops which are not accessible from start/end-blocks
            //      b. that there are block_ids which are connected to multiple start/end-blocks

            let [deduped_block_ids, duplicate_block_ids] = dedupArray(total_traversed_block_ids);

            if (deduped_block_ids.length !== total_traversed_block_ids.length) {
                // console.error("block_ids were accessed via multiple start/end-blocks, most likely indicating a bug in the editor");
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
                        let result = await traverseRole({ role_id, block_id })
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


        // check if 

        /*  if (end_blocks.length > 1) {
             console.error("multiple end-blocks: ", start_blocks, " for role ", role_id);
         } */

        // test #1 check for multiple open start/end-blocks for role
        console.info("control of role took: ", performance.now() - start, "ms");
        console.info("total errors of role", role_id, "after control ", errors);
        return errors;
    }
    this.control = () => {
        let roles = scriptState("roles");
        Object.keys(roles).forEach(role => controlRole(role_id))
    }
}

