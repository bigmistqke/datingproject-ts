import Store from "../helpers/react/Store.js"
import State from "../helpers/react/State.js"

const Viewport = function () {
    Store.call(this);

    this.blurredBorder = new State(true);
    this.elementInFocus = new State(false);

    this.focus = function (id) {
        this.elementInFocus.update(id);
    }
}

export default Viewport;