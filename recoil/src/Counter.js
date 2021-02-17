import {
    atom,
    useRecoilState
} from 'recoil';

const countState = atom({
    key: 'countState', // unique ID (with respect to other atoms/selectors)
    default: '0', // default value (aka initial value)
});

export default function Counter() {
    const [count, setCount] = useRecoilState(countState);

    return <div>count is {count}
        <button onClick={() => { setCount(parseInt(count) + 1) }}>another button</button>
    </div>
}