import React, { useState, useEffect, useRef, memo } from 'react';

let _p = 10;

const Connector = (props) => {
    const [boundaries, setBoundaries] = useState();
    const [SVG, setSVG] = useState();

    const [origin, setOrigin] = useState();

    let r_boundaries = useRef();

    const getBoundsFromPoses = (start_pos, end_pos) => {
        let t_bounds = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
        t_bounds[0].x = start_pos.x < end_pos.x ? start_pos.x : end_pos.x;
        t_bounds[0].y = start_pos.y < end_pos.y ? start_pos.y : end_pos.y;
        t_bounds[1].x = start_pos.x > end_pos.x ? start_pos.x : end_pos.x;
        t_bounds[1].y = start_pos.y > end_pos.y ? start_pos.y : end_pos.y;
        return t_bounds;
    }

    const getSVGFromPoses = (start_pos, end_pos) => {
        let t_coords = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { y: 0 }];
        t_coords[0].x = start_pos.x < end_pos.x ? _p : start_pos.x - end_pos.x + _p;
        t_coords[0].y = start_pos.y < end_pos.y ? _p - 1 : start_pos.y - end_pos.y + _p;
        t_coords[1].x = start_pos.x > end_pos.x ? _p : end_pos.x - start_pos.x + _p;
        t_coords[1].y = start_pos.y > end_pos.y ? _p - 1 : end_pos.y - start_pos.y + _p;
        t_coords[2].y = Math.abs(start_pos.y - end_pos.y) / 2;
        return t_coords;
    }

    useEffect(() => {
        // connectorMove(props.pos);
        let poses = props.pos;
        if (!poses[0] || !poses[1]) { console.error('errorrrr'); return; }
        let t_bounds = getBoundsFromPoses(poses[0], poses[1]);
        setBoundaries(t_bounds);
        let t_SVG = getSVGFromPoses(poses[0], poses[1]);
        setSVG(t_SVG);
        if (props.origin)
            setOrigin(props.origin);
    }, [props.pos[0], props.pos[1]]);


    return boundaries ? <svg className="connectionLine"
        width={Math.abs(boundaries[1].x - boundaries[0].x)}
        height={Math.abs(boundaries[1].y - boundaries[0].y)}
        style={{
            left: boundaries[0].x - origin.x - _p,
            top: boundaries[0].y - origin.y - _p,
            height: Math.abs(boundaries[1].y - boundaries[0].y) + _p * 2,
            width: Math.abs(boundaries[1].x - boundaries[0].x) + _p * 2
        }}>
        <path d={`M${SVG[0].x},${SVG[0].y} C${SVG[0].x},${SVG[2].y} ${SVG[1].x},${SVG[2].y} ${SVG[1].x},${SVG[1].y}`}></path>
    </svg> : null;
}

export default memo(Connector)