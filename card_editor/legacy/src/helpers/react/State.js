import { useState, useRef, useEffect } from 'react';


const State = function (defaultValue) {
    const [state, setState] = useState(defaultValue);
    const r_state = useRef(defaultValue);

    this.state = state;

    useEffect(() => {
        if (state === r_state.current)
            this.state = state;

    }, [state])

    this.update = (value) => {
        r_state.current = value;
        setState(value);
        this.state = r_state.current;
    }
}

export default State