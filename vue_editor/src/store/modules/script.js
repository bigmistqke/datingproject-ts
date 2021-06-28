const state = {
    blocks: [],
    instructions: {},
    roles: {}
}

const getters = {
    allBlocks: state => state.blocks,
    allInstructionsOfBlock: state => block => block.instructions.map(i => state.instructions[i])
}

const actions = {
    async fetchScript({ commit }, { script_id }) {
        let res = await fetch(`http://localhost:8080/api/script/get/${script_id}`);
        res = await res.json();
        commit('setScript', res);
    },
    async moveBlock({ commit, state }, { block, delta }) {
        commit('setBlock', { ...block, position: { x: block.position.x + delta.x, y: block.position.y + delta.y } });
    },
    async changeTypeInstruction({ commit, state }, { instruction, type }) {
        commit('setInstruction', { ...instruction, type });
    },
}

const mutations = {
    setScript: (state, script) => {
        let _blocks = {};
        script.blocks.map(block => _blocks[block.block_id] = block);

        state.blocks = _blocks;
        state.instructions = script.instructions;
        state.roles = script.roles;
    },
    setBlock: (state, block) => {
        console.log('setBlock', block);
        state.blocks = { ...state.blocks, [block.block_id]: block };
    },
    setInstruction: (state, instruction) => {
        state.instructions = { ...state.instructions, [instruction.instruction_id]: instruction };
    }
}

export default { state, getters, actions, mutations }