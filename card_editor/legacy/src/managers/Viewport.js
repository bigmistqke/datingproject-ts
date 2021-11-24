import Store from "../helpers/react"

const Viewport = function () {
    Store.call(this);

    this.blurredBorder = new State(true);
    this.elementInFocus = new State(false);

    this.focus = function (id) {
        this.elementInFocus.update(id);
    }
}

export default Viewport;