import React, { useEffect, useContext, useRef } from 'react';
import Tweener from "../helpers/tweener.js"

const cTweener = React.createContext(new Tweener());

const Swipe = (props) => {
    const tweener = useContext(cTweener);
    let card = useRef(null);
    let delta = useRef({ x: 0, y: 0 });
    let posStart = useRef({ x: 0, y: 0 });
    let transform = useRef({ x: 0, y: 0 });

    let current = {
        delta: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        prevTime: null,
        start: { x: 0, y: 0 },
        lastSwipe: null
    };

    useEffect(() => {
        if (!card.current || !props.flip) return;
        card.current.classList.remove("flip");

    });
    useEffect(() => {
        console.log(props.canPlay);
    }, [props.canPlay]);

    const getCoords = (e) => {
        let coords = {};
        let offset = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (e.type.includes("touch")) {
            coords.x = e.touches[0].clientX - offset.x;
            coords.y = e.touches[0].clientY - offset.y;
        } else {
            coords.x = e.clientX - offset.x;
            coords.y = e.clientY - offset.y;
        }
        return coords;
    }

    const onSwipeStart = (e) => {
        current.prevTime = new Date().getTime();
        if (props.canSwipe) {
            let coords = getCoords(e);
            posStart = coords;
            current.swiping = true;
        }
        window.addEventListener('mousemove', onSwipe);
        window.addEventListener('mouseup', onSwipeEnd);
    }
    const onSwipe = (e) => {
        if (!current.swiping) {
            return;
        }
        let coords = getCoords(e);
        delta.current = { x: coords.x - posStart.x, y: coords.y - posStart.y };
        card.current.style.transform = getTransform(delta.current, transform.current);
    }

    const getTransform = (delta, offset) => {
        let position = { x: delta.x + offset.x, y: delta.y + offset.y };
        return `translateX(${position.x}px) translateY(${position.y}px) rotateZ(${2 * (position.x) / window.innerWidth * 30}deg) /* rotateX(${2 * (position.y) / window.innerHeight * 30}deg)*/`;
    }

    const swipeAway = () => {
        let deltaSnap = { x: parseFloat(delta.current.x), y: parseFloat(delta.current.y) };
        let angle = Math.atan2(delta.current.y, delta.current.x);
        var newDist = { x: (window.innerWidth * 1.75 * Math.cos(angle)), y: (window.innerHeight * 1.25 * Math.sin(angle)) };
        tweener.tweenTo(0, 1, 1000,
            (alpha) => {
                delta.current = {
                    x: deltaSnap.x + (newDist.x - deltaSnap.x) * alpha,
                    y: deltaSnap.y + (newDist.y - deltaSnap.y) * alpha
                };
                if (!card.current) return;
                transform.current = delta.current;
                card.current.style.transform = getTransform(delta.current, { x: 0, y: 0 });
            },
            () => {

            }
        );
    }

    const snapBack = () => {
        let deltaSnap = { x: parseFloat(delta.current.x), y: parseFloat(delta.current.y) };
        tweener.tweenTo(1, 0, 500,
            (alpha) => {
                delta.current = {
                    x: deltaSnap.x * alpha,
                    y: deltaSnap.y * alpha
                };
                transform.current = delta.current;
                card.current.style.transform = getTransform(delta.current, { x: 0, y: 0 });
            },
            () => {

            }
        );
    }

    const onSwipeEnd = (e) => {
        current.swiping = false;
        if (!props.canPlay) { snapBack() }

        let dragThreshold = ((Math.abs(delta.current.x) > window.innerWidth / 5 || Math.abs(delta.current.y) > window.innerHeight / 5)) ? true : false;
        if (dragThreshold) {
            props.swipeAction(props.zIndex)
            swipeAway();
        } else {
            snapBack();
        }


        current.lastSwipe = false;
        window.removeEventListener('mousemove', onSwipe);
        window.removeEventListener('mouseup', onSwipeEnd);
    }


    return <div ref={card} style={{ zIndex: props.zIndex }} className="swipe flip" onTouchStart={onSwipeStart} onTouchMove={onSwipe} onTouchEnd={onSwipeEnd} onMouseDown={onSwipeStart} /* onMouseMove={onSwipe}  *//* onMouseUp={onSwipeEnd} */>{props.children}</div>
}


export default Swipe;