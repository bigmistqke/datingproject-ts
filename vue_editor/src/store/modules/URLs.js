const state = {
    URL: {
        fetch: 'http://localhost:8080'
    }
}

const getters = {
    getFetchURL: (state) => { console.log('get url'); return state.URL.fetch }
}

const actions = {

}

const mutations = {

}

export default { state, getters, actions, mutations }