
const cursorEventHandler = (move_callback = () => { }, end_callback = () => { }) =>
    new Promise((resolve) => {
        const end = (e) => {
            window.removeEventListener("pointermove", move_callback);
            window.removeEventListener("pointerup", end);
            try {
                dom.releasePointerCapture(e.pointerId);
            } catch (e) { }
            resolve(e);
        }

        window.addEventListener("pointermove", move_callback);
        window.addEventListener("pointerup", end);
        try {
            dom.setPointerCapture(e.pointerId);
        } catch (e) { }
    })

export default cursorEventHandler;
