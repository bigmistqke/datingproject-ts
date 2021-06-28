const state = {
    origin: { x: 0, y: 0 },
    zoom: 1,
}

const getters = {
    origin: state => state.origin,
    zoom: state => state.zoom,
}

const actions = {
    async setOrigin({ commit }, { origin }) {
        commit('setOrigin', origin);
    },
    async addToOrigin({ commit, state }, { delta }) {
        commit('setOrigin', {
            x: state.origin.x + delta.x,
            y: state.origin.y + delta.y
        });
    },
    async setZoom({ commit }, { zoom }) {
        commit('setZoom', zoom);
    },
}

const mutations = {
    setOrigin: (state, origin) => state.origin = origin,
    setZoom: (state, zoom) => state.zoom = zoom,
}

export default { state, getters, actions, mutations }