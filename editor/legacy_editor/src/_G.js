import {
    atom
} from 'recoil';

export default function _G() {

    this.socket = atom({
        key: 'socket', // unique ID (with respect to other atoms/selectors)
        default: '', // default value (aka initial value)
    });
}
