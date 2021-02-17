import logo from './logo.svg';
import './App.css';
import Counter from "./Counter"

import {
  atom,
  useRecoilState
} from 'recoil';

const countState = atom({
  key: 'countState', // unique ID (with respect to other atoms/selectors)
  default: '0', // default value (aka initial value)
});

function App() {
  const [count] = useRecoilState(countState);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <Counter></Counter>
        <button>this button</button>
          Learn React

      </header>
    </div>
  );
}

export default App;
