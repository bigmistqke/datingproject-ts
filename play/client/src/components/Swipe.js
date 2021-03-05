import React, { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import Tweener from "../helpers/tweener.js";

const cTweener = React.createContext(new Tweener());

const Swipe = forwardRef((props, ref) => {
    // const tweener = useContext(cTweener);
    // const tweener = new Tweener();
    const tweener = useRef(new Tweener());
    let card = useRef(null);
    let delta = useRef({ x: 0, y: 0 });
    let posStart = useRef({ x: 0, y: 0 });
    let transform = useRef({ x: 0, y: 0 });
    let r_screen = useRef({ x: window.innerWidth, y: window.innerHeight })

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

        let coords = getCoords(e);
        posStart = coords;
        current.swiping = true;

        if (!props.canSwipe) {
            props.waitYourTurn(!props.flip ? 'Wait For Your Turn' : 'Wait For Timespan To Be Completed')
        }

        window.addEventListener('mousemove', onSwipeMove);
        window.addEventListener('mouseup', onSwipeEnd);

        window.addEventListener('touchmove', onSwipeMove);
        window.addEventListener('touchend', onSwipeEnd);

    }

    const move = (e) => {
        // e.preventDefault();
        // e.stopPropagation();
        if (!current.swiping) {
            return;
        }
        let coords = getCoords(e);
        delta.current = { x: coords.x - posStart.x, y: coords.y - posStart.y };
        card.current.style.transform = getTransform(delta.current, transform.current);
    }
    const onSwipeMove = (e) => {
        // throttledMove(e);
        move(e)
    }

    const getTransform = (delta, offset) => {
        const position = { x: delta.x + offset.x, y: delta.y + offset.y };
        return `translateX(${position.x}px) translateY(${position.y}px) rotateZ(${2 * (position.x) / r_screen.current.x * 30}deg) /* rotateX(${2 * (position.y) / r_screen.current.y * 30}deg)*/`;
    }


    useImperativeHandle(ref, () => ({
        videoDone() {
            delta.current = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
            let deltaSnap = { x: parseFloat(delta.current.x), y: parseFloat(delta.current.y) };
            let angle = Math.atan2(delta.current.y, delta.current.x);
            var newDist = { x: (window.innerWidth * 1.75 * Math.cos(angle)), y: (window.innerHeight * 1.25 * Math.sin(angle)) };

            tweener.current.tweenTo(0, 1, 1000,
                (alpha) => {
                    delta.current = {
                        x: deltaSnap.x + (newDist.x - deltaSnap.x) * alpha,
                        y: deltaSnap.y + (newDist.y - deltaSnap.y) * alpha
                    };
                    if (!card.current) return;
                    transform.current = delta.current;
                    card.current.style.transform = `translateX(${transform.current.x}px) translateY(${transform.current.y}px) rotateZ(${2 * (transform.current.x) / r_screen.current.x * 30}deg)`;
                },
                () => {

                }
            );
        }

    }))


    const swipeAway = () => {
        let deltaSnap = { x: parseFloat(delta.current.x), y: parseFloat(delta.current.y) };
        let angle = Math.atan2(delta.current.y, delta.current.x);
        var newDist = { x: (window.innerWidth * 1.75 * Math.cos(angle)), y: (window.innerHeight * 1.25 * Math.sin(angle)) };
        tweener.current.tweenTo(0, 1, 500,
            (alpha) => {
                delta.current = {
                    x: deltaSnap.x + (newDist.x - deltaSnap.x) * alpha,
                    y: deltaSnap.y + (newDist.y - deltaSnap.y) * alpha
                };
                if (!card.current) return;
                transform.current = delta.current;
                card.current.style.transform = `translateX(${transform.current.x}px) translateY(${transform.current.y}px) rotateZ(${2 * (transform.current.x) / r_screen.current.x * 30}deg)`;
            },
            () => {

            }
        );
    }



    const snapBack = useCallback(() => {
        let deltaSnap = { x: parseFloat(delta.current.x), y: parseFloat(delta.current.y) };
        if (Math.abs(deltaSnap.x) === 0 && Math.abs(deltaSnap.y) === 0) return;
        tweener.current.tweenTo(1, 0, 250,
            (alpha) => {
                delta.current = {
                    x: deltaSnap.x * alpha,
                    y: deltaSnap.y * alpha
                };
                transform.current = delta.current;
                card.current.style.transform = `translateX(${delta.current.x}px) translateY(${delta.current.y}px) rotateZ(${2 * (delta.current.x) / r_screen.current.x * 30}deg) /* rotateX(${2 * (delta.current.y) / r_screen.current.y * 30}deg)*/`;
                // card.current.style.transform = getTransform(delta.current, { x: 0, y: 0 });
            },
            () => {

            }
        );
    }, [])

    const onSwipeEnd = (e) => {
        current.swiping = false;
        if (!props.canPlay) { snapBack() }
        props.waitYourTurn(false);
        let dragThreshold = ((Math.abs(delta.current.x) > window.innerWidth / 5 || Math.abs(delta.current.y) > window.innerHeight / 5)) ? true : false;
        if (dragThreshold && props.canSwipe) {
            swipeAway();
            setTimeout(() => {
                props.swipeAction(props.zIndex)
            }, 125)

        } else {
            snapBack();
        }

        current.lastSwipe = false;
        window.removeEventListener('mousemove', onSwipeMove);
        window.removeEventListener('mouseup', onSwipeEnd);
        window.removeEventListener('touchmove', onSwipeMove);
        window.removeEventListener('touchend', onSwipeEnd);
    }


    return (
        <div
            ref={card}
            style={{
                zIndex: props.zIndex
            }}

            className="swipe flip"
            onTouchStart={onSwipeStart}
            onMouseDown={onSwipeStart}
        > { props.children}</div >
    )
})


export default Swipe;