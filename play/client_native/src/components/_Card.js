import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Vibrate } from 'react-native';
import Video from 'react-native-video';
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


const Card = ({ instruction_id, type, waitYourTurn, text, timespan, flip, canPlay, swipeAction, zIndex, dataurl, video, alarm }) => {
    const [spanCompleted, setSpanCompleted] = useState(false);
    const [formattedText, setFormattedText] = useState();
    const [hasChoices, setHasChoices] = useState();

    let r_swipe = useRef();
    let r_stopVideo = useRef(false);
    let r_stopTimespan = useRef(false);


    useEffect(() => {
        if (flip) {
            try {
                Vibration.vibrate(100)
            } catch (e) {
                console.error(e);
            }
        };
    }, [flip])

    const timedSwipe = useCallback(async () => {
        setSpanCompleted(true);
        try {
            Vibration.vibrate(200)
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
            <Text>

            </Text>
            {/* <View className={`instruction instruction--${type}`}>
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
            </View> */}
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
                return <View></View>
        }
    }, [])
    return <>
        <View className='stopwatch'>
            {remainingTime}
        </View>
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
                return <View></View>
        }
    }
    return <View className='card'>
        {children}
        {getType(type)}
        <Frame style={{ zIndex: 1 }}></Frame>
    </View>
}

function Timer({ timespan, remainingTime, children }) {
    let timer = useRef(false);

    useEffect(() => {
        if (!timer.current) return
        let percentage = (timespan - remainingTime) / (timespan) * 100;
        timer.current.style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${percentage}%, 0% ${percentage}%)`;
    }, [timespan, remainingTime])

    return (
        <View className='timer' ref={timer}>
            {children}
        </View>
    )
}


function VideoSide({ text, flip, swipeAction, dataurl, stop, instruction_id }) {
    const r_video = useRef(false);
    const r_previousTime = useRef();
    const r_nextCheck = useRef();


    useEffect(() => {
        return function cleanup() {
            console.info('cleanUP!!!!!');
            clearTimeout(r_nextCheck.current);
        }
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
        }, 0)
    }, [dataurl, flip, swipeAction])


    const play = useCallback((e) => {
        let video = r_video.current;
        if (!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2)) {
            video.play();
        }
        setTimeout(() => {
            video.removeAttribute('muted');
        }, 0)
    }, [])



    return (
        <View className="front"
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
        </View>
    )
}

function TextLayOut({ formattedText }) {
    return <View className='text'>
        {
            formattedText ? formattedText.map(
                ({ type, text }) => {
                    return type === 'normal' ?
                        text :
                        <View className='choice' key={text.toString()}>
                            {
                                text.map(choice =>
                                    <View key={choice}>
                                        <Text>{choice}</Text>

                                    </View>
                                )
                            }
                        </View>
                }
            ) : null
        }
    </View>
}

function FrontSide({ text, type, flip, timespan, stopTimespan, timedSwipe, formattedText, hasChoices }) {

    const [remainingTime, setRemainingTime] = useState(0);
    const r_animating = useRef(false);
    const r_startTime = useRef();
    const r_shouldStop = useRef(false);

    useEffect(() => {
        if (!flip || !timespan) return;
        try {
            Vibration.vibrate(200);
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



    return (
        <View className="front">
            {
                timespan === 0 ?
                    <View>
                        <CardType type={type}>
                            {
                                hasChoices ?
                                    <ChoiceLabel style={{ zIndex: 3 }}></ChoiceLabel> :
                                    null
                            }
                            <SwipeLabel style={{ zIndex: 2 }}></SwipeLabel>
                            <Text formattedText={formattedText}></Text>
                        </CardType>
                    </View> :
                    <>
                        <CardType type={type}>
                            {
                                hasChoices ?
                                    <ChoiceLabel style={{ zIndex: 3 }}></ChoiceLabel> :
                                    null
                            }
                            <TimerLabel type={type} remainingTime={Math.floor(remainingTime)}></TimerLabel>
                            <TextLayOut formattedText={formattedText}></TextLayOut>
                        </CardType>
                        <Timer timespan={timespan} remainingTime={remainingTime}>
                            <CardType type={type}>
                                {
                                    hasChoices ?
                                        <ChoiceLabel style={{ zIndex: 3 }}></ChoiceLabel> :
                                        null
                                }
                                <TimerLabel type={type} remainingTime={Math.floor(remainingTime)}></TimerLabel>
                                <TextLayOut formattedText={formattedText}></TextLayOut>
                            </CardType>
                        </Timer>
                    </>
            }

        </View>
    )
}
function BackSide() {
    return (
        <View className="back">
            <CardType type="back"></CardType>
        </View>
    )
}



export default Card