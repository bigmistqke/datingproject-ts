import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import State from "../helpers/react/State.js"

let _p = 10;

const Connection = (props) => {
    const boundaries = new State();
    const SVG = new State();


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
        let poses = props.pos;
        if (!poses[0] || !poses[1]) return
        let t_bounds = getBoundsFromPoses(poses[0], poses[1]);
        boundaries.set(t_bounds);
        let t_SVG = getSVGFromPoses(poses[0], poses[1]);
        SVG.set(t_SVG);
    }, [props.pos[0], props.pos[1]]);

    return boundaries.get() && props.origin ? <svg className="connectionLine"
        width={Math.abs(boundaries.get()[1].x - boundaries.get()[0].x)}
        height={Math.abs(boundaries.get()[1].y - boundaries.get()[0].y)}
        style={{
            left: (boundaries.get()[0].x - _p),
            top: (boundaries.get()[0].y - _p),
            height: Math.abs(boundaries.get()[1].y - boundaries.get()[0].y) + _p * 2,
            width: Math.abs(boundaries.get()[1].x - boundaries.get()[0].x) + _p * 2
        }}>
        <path d={`M${SVG.get()[0].x},${SVG.get()[0].y} C${SVG.get()[0].x},${SVG.get()[2].y} ${SVG.get()[1].x},${SVG.get()[2].y} ${SVG.get()[1].x},${SVG.get()[1].y}`}></path>
    </svg> : null;
}

export default memo(Connection)