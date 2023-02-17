import { useState, useRef, useEffect } from 'react';

const Store = function () {
    const [state, setState] = useState({});
    let r_state = useRef({});
    this.state = state;

    useEffect(() => {
        if (r_state.current === state)
            this.state = state;
    }, [state])

    this.update = (id, element) => {
        r_state.current = { ...this.state, [id]: element }
        setState({ ...r_state.current, [id]: element });
        this.state = r_state.current;
    }
    this.delete = (id) => {
        let _state = { ...this.state };
        delete _state[id];
        r_state.current = _state;
        setState(_state);
    }

    this.updateAll = (_state) => {
        r_state.current = _state;
        setState(_state);
        this.state = r_state.current;
    }
}

export default Store