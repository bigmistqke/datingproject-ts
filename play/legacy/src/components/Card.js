import React, { useEffect, useRef, useState, useCallback } from 'react';
import Swipe from "./Swipe";
// import do from '../svg/do.png';


import { ReactComponent as Do } from '../svg/do.svg';
import { ReactComponent as Say } from '../svg/say.svg';
import { ReactComponent as Think } from '../svg/do.svg';
import { ReactComponent as Idle } from '../svg/do.svg';

import { ReactComponent as Back } from '../svg/wait.svg';

import { ReactComponent as SwipeLabel } from '../svg/swipe_label.svg';
import { ReactComponent as ChoiceLabel } from '../svg/choice_label.svg';

import { ReactComponent as DoTimer } from '../svg/do_timer.svg';
import { ReactComponent as SayTimer } from '../svg/say_timer.svg';
import { ReactComponent as ThinkTimer } from '../svg/do_timer.svg';
import { ReactComponent as IdleTimer } from '../svg/do_timer.svg';

import { ReactComponent as Frame } from '../svg/frame.svg';


import decodeSingleQuotes from "../helpers/decodeSingleQuotes"





const Card = ({ instruction_id, type, waitYourTurn, text, timespan, flip, canPlay, swipeAction, zIndex, dataurl, video, alarm }) => {
    const [spanCompleted, setSpanCompleted] = useState(false);
    let r_swipe = useRef();
    let r_stopVideo = useRef(false);
    let r_stopTimespan = useRef(false);
    let r_swipeAnimation = useRef(false);
    const [formattedText, setFormattedText] = useState();
    const [hasChoices, setHasChoices] = useState();

    useEffect(() => {
        if (flip) {
            try {
                window.navigator.vibrate(100)
            } catch (e) {
                console.error(e);
            }
        };
    }, [flip])

    const timedSwipe = useCallback(async () => {
        setSpanCompleted(true);
        try {
            window.navigator.vibrate(200)
        } catch (e) {
            console.error(e);
        }
        if (alarm) {
            alarm();
        }
        if (r_swipe.current) {
            r_swipe.current.swipeAnimation()
        }

        setTimeout(() => {
            swipeAction();
        }, 250);
    }, [alarm, swipeAction])

    useEffect(() => {
        if (text) {
            let _formattedText = formatText(text);
            setHasChoices(_formattedText.find(el => el.type === 'choice' && el.text.length > 1));
            setFormattedText(_formattedText);
        }
    }, [text])


    const formatText = (_text) => {
        let _formattedText = [{ type: 'normal', text: _text }];

        const regex = /[["](.*?)[\]"][.!?\\-]?/g

        let matches = _text.match(regex);

        if (matches) {
            for (let i = matches.length - 1; i >= 0; i--) {
                let split = _formattedText.shift().text.split(`${matches[i]}`);

                let multi_choice = matches[i].replace('[', '').replace(']', '');
                let choices = multi_choice.split('/');


                _formattedText = [
                    { type: 'normal', text: split[0] },
                    { type: 'choice', text: choices },
                    { type: 'normal', text: split[1] },
                    ..._formattedText
                ];
            }
        }

        return _formattedText;
    }

    return (
        <Swipe
            canPlay={canPlay}
            ref={r_swipe}
            waitYourTurn={waitYourTurn}
            swipeAction={() => {
                swipeAction();
                if (type === 'video') {
                    r_stopVideo.current = true;
                }
                if (timespan) {
                    r_stopTimespan.current = true;
                }
            }}
            canSwipe={window.isUnsafe ? flip : type !== 'video' ? timespan == 0 ? flip : spanCompleted : null}
            flip={flip}
            zIndex={zIndex}>
            <div className={`instruction instruction--${type}`}>
                {type === 'video' ?
                    <VideoSide
                        text={text}
                        flip={flip}
                        instruction_id={instruction_id}
                        swipeAction={() => {
                            if (type === 'video') { r_swipe.current.swipeAnimation() };
                            swipeAction()
                        }}
                        dataurl={dataurl}
                        stop={r_stopVideo.current}></VideoSide> :
                    <FrontSide
                        text={text}
                        type={type}
                        timespan={timespan}
                        timedSwipe={timedSwipe}
                        flip={flip}
                        stop={r_stopTimespan.current}
                        formattedText={formattedText}
                        hasChoices={hasChoices}
                    ></FrontSide>
                }
                <BackSide></BackSide>
            </div>
        </Swipe>);
}

function TimerLabel({ type, remainingTime }) {
    const getType = useCallback((type) => {
        switch (type) {
            case 'do':
                return <DoTimer style={{ zIndex: 2 }}></DoTimer>
            case 'say':
                return <SayTimer style={{ zIndex: 2 }}></SayTimer>
            case 'think':
                return <ThinkTimer style={{ zIndex: 2 }}></ThinkTimer>
            case 'idle':
                return <IdleTimer style={{ zIndex: 2 }}></IdleTimer>
            default:
                return <div></div>
        }
    }, [])
    return <>
        <div className='stopwatch'>
            {remainingTime}
        </div>
        {getType(type)}
    </>
}

function CardType({ type, children }) {
    const getType = (type) => {
        switch (type) {
            case 'do':
                return <Do style={{ zIndex: 2 }}></Do>
            case 'say':
                return <Say style={{ zIndex: 2 }}></Say>
            case 'think':
                return <Think style={{ zIndex: 2 }}></Think>
            case 'back':
                return <Back style={{ zIndex: 2 }}></Back>
            case 'idle':
                return <Idle style={{ zIndex: 2 }}></Idle>
            default:
                return <div></div>
        }
    }
    return <div className='card'>
        {children}
        {getType(type)}
        <Frame style={{ zIndex: 1 }}></Frame>
    </div>
}

function Timer({ timespan, remainingTime, children }) {
    let timer = useRef(false);

    useEffect(() => {
        if (!timer.current) return
        let percentage = (timespan - remainingTime) / (timespan) * 100;
        timer.current.style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${percentage}%, 0% ${percentage}%)`;
    }, [timespan, remainingTime])

    return (
        <div className='timer' ref={timer}>
            {children}
        </div>
    )
}


function VideoSide({ text, flip, swipeAction, dataurl, stop, instruction_id }) {
    const r_video = useRef(false);
    const [url, setUrl] = useState();
    const r_previousTime = useRef();
    const r_nextCheck = useRef();
    const checkVideo = useCallback(() => {
        if (!r_video.current) return;
        console.log('cheeeeeeeeck', r_previousTime.current, r_video.current.currentTime);
        if (r_previousTime.current === r_video.current.currentTime && r_video.current.currentTime !== 0) {
            console.error('video stopped playing????');
        } else {
            // console.info('all good');
        }
        r_previousTime.current = r_video.current.currentTime;
        r_nextCheck.current = setTimeout(checkVideo, 500);


    }, [])

    useEffect(() => {
        return function cleanup() {
            console.info('cleanUP!!!!!');
            clearTimeout(r_nextCheck.current);
        }
    }, [])


    const play = useCallback((e) => {
        let video = r_video.current;
        if (!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2)) {
            video.play();
        }
        setTimeout(() => {
            video.removeAttribute('muted');
        }, 0)
    }, [])


    useEffect(() => {
        if (!stop) return;
        r_video.current.pause();
    }, [stop])

    useEffect(() => {
        if (!flip) return;

        r_video.current.addEventListener('ended', () => {
            swipeAction();

        })

        r_video.current.classList.remove('hidden');
        setTimeout(() => {
            r_previousTime.current = 0;
            r_video.current.play();
            // checkVideo();
        }, 0)
        /*         setTimeout(() => {
                    r_video.current.removeAttribute('muted');
                    r_video.current.volume = 1;
                }, 50) */


        // setUrl(dataurl)
    }, [checkVideo, dataurl, flip, swipeAction])
    return (
        <div className="front"
            onClick={play}
        >
            {text !== '' ?
                <video
                    className="video hidden"
                    id={`${instruction_id}_video`}
                    ref={r_video}
                    // muted
                    playsInline
                    src={dataurl ? dataurl.src : null}
                >
                </video> : null
            }
        </div>
    )
}

function Text({ formattedText }) {
    useEffect(() => {
        if (!formattedText) return;
        console.log('Text formattedText', formattedText[0].text, formattedText[0].type);
    }, [formattedText])
    return <div className='text'>
        {
            formattedText ? formattedText.map(
                ({ type, text }) => {
                    return type === 'normal' ?
                        text :
                        <div className='choice' key={text.toString()}>
                            {
                                text.map(choice =>
                                    <div key={choice}>
                                        <span>{choice}</span>

                                    </div>
                                )
                            }
                        </div>
                }
            ) : null
        }
    </div>
}

function FrontSide({ text, type, flip, timespan, stopTimespan, timedSwipe, formattedText, hasChoices }) {

    const [remainingTime, setRemainingTime] = useState(0);
    const stopwatch = useRef(false);
    const r_animating = useRef(false);
    const r_flip = useRef(false);
    const r_startTime = useRef();
    const r_shouldStop = useRef(false);

    useEffect(() => {
        if (!flip || !timespan) return;
        try {
            window.navigator.vibrate(200);
        } catch (e) {
            console.error(e);
        }
    }, [flip, timespan])

    useEffect(() => {
        return () => {
            r_shouldStop.current = true;
        }
    }, [])

    let animate = useCallback(() => {
        if (r_shouldStop.current) return;
        let remaining_time = ((timespan * 1000) - (performance.now() - r_startTime.current)) / 1000;

        if (remaining_time < 0) {
            timedSwipe();
            return;
        };
        setTimeout(animate, 30);
        setRemainingTime(remaining_time);
    }, [])

    useEffect(() => {
        if (!flip || !timespan || timespan === 0 || r_animating.current) return;
        r_startTime.current = performance.now();

        r_animating.current = true;
        animate();
    }, [flip, timedSwipe, timespan])

    useEffect(() => {
        console.log(type, formattedText);
        if (type === 'say' && formattedText) {
            console.log('formattedText say', formattedText[0].text);
        }
    }, [type, formattedText])

    return (
        <div className="front">
            {
                timespan === 0 ?
                    <div>
                        <CardType type={type}>
                            {
                                hasChoices ?
                                    <ChoiceLabel style={{ zIndex: 3 }}></ChoiceLabel> :
                                    null
                            }
                            <SwipeLabel style={{ zIndex: 2 }}></SwipeLabel>
                            <Text formattedText={formattedText}></Text>
                        </CardType>
                    </div> :
                    <>
                        <CardType type={type}>
                            {
                                hasChoices ?
                                    <ChoiceLabel style={{ zIndex: 3 }}></ChoiceLabel> :
                                    null
                            }
                            <TimerLabel type={type} remainingTime={Math.floor(remainingTime)}></TimerLabel>
                            <Text formattedText={formattedText}></Text>
                        </CardType>
                        <Timer timespan={timespan} remainingTime={remainingTime}>
                            <CardType type={type}>
                                {
                                    hasChoices ?
                                        <ChoiceLabel style={{ zIndex: 3 }}></ChoiceLabel> :
                                        null
                                }
                                <TimerLabel type={type} remainingTime={Math.floor(remainingTime)}></TimerLabel>
                                <Text formattedText={formattedText}></Text>
                            </CardType>
                        </Timer>
                    </>
            }

        </div>
    )
}
function BackSide() {
    return (
        <div className="back">
            {/* <div className="wait">
                <div>wait</div>
            </div> */}
            <CardType type="back"></CardType>
        </div>
    )
}



export default Card