import Emitter from "./Emitter.js"

export default e => {
    if (e.buttons === 2) return;
    let delta;
    let coords = { x: e.clientX, y: e.clientY };
    let now = performance.now();

    const eventEmitter = new Emitter();


    const drag = (e) => {
        delta = { x: (coords.x - e.clientX) * -1, y: (coords.y - e.clientY) * -1 };
        coords = { x: e.clientX, y: e.clientY };
        eventEmitter.emit('update', delta);
    }

    const end = (e) => {
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (e) {
            console.info('releasePointerCapture is not available');
        }
        e.target.removeEventListener("pointermove", drag);
        e.target.removeEventListener("pointerup", end);
    }

    e.target.addEventListener("pointermove", drag);
    e.target.addEventListener("pointerup", end);
    e.target.setPointerCapture(e.pointerId ? e.pointerId : 1);

    e.preventDefault();


    return eventEmitter;
}