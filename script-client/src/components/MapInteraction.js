const MapInteraction = () => {

    let r_coords = useRef({ x: 0, y: 0 });
    let r_coords_start = useRef();

    let r_shiftPressed = useRef(true);

    let r_isNavigating = useRef(false);
    let r_isDragging = useRef(false);
    let r_dragNode = useRef();

    const keyUp = (e) => {
        ctrl_ref.current = false;
    }
    const keyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
            ctrl_ref.current = true;
        }
        if (e.shiftKey) {
            r_shiftPressed.current = true;
        }
    }

    const createNode = (e) => {
        e.preventDefault();
        let tempNodes = [...r_nodes.current];
        let newNode = getDefaultNode();
        let coords_temp = r_coords.current;
        newNode.position = { x: coords_temp.x * - 1 + e.clientX, y: coords_temp.y * -1 + e.clientY };
        tempNodes.push(newNode);
        setNodes(tempNodes);
        r_nodes.current = tempNodes;
    }

    const dragDown = (e, node) => {
        if (!e.target.classList.contains("node")) return;
        e.target.addEventListener("mousemove", dragMove);
        e.target.addEventListener("mouseup", dragUp);
        e.target.setCapture();
        r_coords_start.current = { x: e.clientX, y: e.clientY };
        r_isDragging.current = true;
        r_dragNode.current = node;
        e.preventDefault();
    }
    const dragMove = (e) => {
        let node = r_dragNode.current;
        console.log(node);
        let coords_start = r_coords_start.current;
        let coords_delta = { x: (coords_start.x - e.clientX) * -1, y: (coords_start.y - e.clientY) * -1 };
        let tempNodes = [...r_nodes.current];
        tempNodes.find(v => v.node_id === node.node_id).position = { x: node.position.x + coords_delta.x, y: node.position.y + coords_delta.y };
        setNodes(tempNodes);
        r_coords_start.current = { x: e.clientX, y: e.clientY };
    }
    const dragUp = (e) => {
        e.target.removeEventListener("mousemove", dragMove);
        e.target.removeEventListener("mouseup", dragUp);
        document.releaseCapture();
    }

    const navDown = (e) => {
        if (!e.target.classList.contains("App")) return;
        setShowOverlay(false);

        e.target.addEventListener("mousemove", navMove);
        e.target.addEventListener("mouseup", navUp);
        e.target.setCapture();
        r_coords_start.current = { x: e.clientX, y: e.clientY };
        if (ctrl_ref.current || e.target.classList.contains("App")) {
            r_isNavigating.current = true;
            e.preventDefault();
        }
    }

    const navMove = (e) => {
        if (r_isNavigating.current) {
            let coords_temp = r_coords.current;
            let coords_start = r_coords_start.current;
            let coords_delta = { x: (coords_start.x - e.clientX) * -1, y: (coords_start.y - e.clientY) * -1 };
            map_DOM.current.style.transform = `translateX(${coords_delta.x + coords_temp.x}px) translateY(${coords_delta.y + coords_temp.y}px)`;
        }
    }

    const navUp = (e) => {

        if (r_isNavigating.current) {
            document.releaseCapture();

            let coords_temp = r_coords.current;
            let coords_start = r_coords_start.current;
            let coords_delta = { x: (coords_start.x - e.clientX) * -1, y: (coords_start.y - e.clientY) * -1 };

            r_coords.current = { x: coords_delta.x + coords_temp.x, y: coords_delta.y + coords_temp.y };
            r_isNavigating.current = false;
            e.target.removeEventListener("mousemove", navMove);


        }

        console.log(r_isConnecting.current);


    }
}

export default MapInteraction;