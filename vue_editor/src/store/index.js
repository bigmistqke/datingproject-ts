import { createStore } from "vuex";
import script from "./modules/script.js";
import navigation from "./modules/navigation.js";
import connections from "./modules/connections.js";
import URLs from "./modules/URLs.js";

export default createStore({
  state: {

  },
  getters: {
  },
  mutations: {

  },
  actions: {

  },
  modules: { script, navigation, connections, URLs },
});
