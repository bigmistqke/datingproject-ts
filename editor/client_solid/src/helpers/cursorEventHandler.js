import Emitter from "./Emitter"

function cursorEventHandler(move_callback, end_callback = () => { }) {
    return new Promise((resolve) => {

        const end = (e) => {
            window.removeEventListener("pointermove", move_callback);
            window.removeEventListener("pointerup", end);
            try {
                dom.releasePointerCapture(e.pointerId);
            } catch (e) {
                console.info('no releasePointerCapture');
            }
            // end_callback();
            resolve();
        }

        window.addEventListener("pointermove", move_callback);
        window.addEventListener("pointerup", end);
        try {
            dom.setPointerCapture(e.pointerId);
        } catch (e) {
            console.info('no setPointerCapture');
        }
    })
}
export default cursorEventHandler;