import Emitter from '../helpers/Emitter'

export default function BlockPositionManager() {
    Emitter.call(this);

    let coords = {};
    let block = '';
    let position = {};
    let lastTick = performance.now();
    let invertedZoom = 1;

    this.start = (e, _block, _zoom) => {
        if (!e.target.classList.contains("block")) return;
        block = _block;

        ////console.log(_zoom);
        invertedZoom = 1 / _zoom;

        coords = { x: e.clientX, y: e.clientY };
        position = block.position;
        //////console.log('move start');

        document.body.addEventListener("pointermove", move);
        document.body.addEventListener("pointerup", end);
        try {
            document.body.setPointerCapture(e.pointerId);
        } catch (e) {
            console.error('no setPointerCapture');
        }
        e.preventDefault();
        e.stopPropagation();
    }

    const move = (e) => {
        //////console.log('move');
        if (performance.now() - lastTick < 1000 / 60) return;
        lastTick = performance.now();
        const coords_delta = {
            x: (coords.x - e.clientX) * -1 * invertedZoom,
            y: (coords.y - e.clientY) * -1 * invertedZoom
        };

        position = {
            x: position.x + coords_delta.x,
            y: position.y + coords_delta.y
        };
        const event = new CustomEvent('update', { detail: { block_id: block.block_id, position: position } });

        this.dispatchEvent(event);
        coords = { x: e.clientX, y: e.clientY };
    }
    const end = (e) => {
        document.body.removeEventListener("pointermove", move);
        document.body.removeEventListener("pointerup", end);
        try {
            document.body.releasePointerCapture(e.pointerId);
        } catch (e) {
            console.error('no releasePointerCapture');
        }
    }
}