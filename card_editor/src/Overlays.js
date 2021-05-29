import React, { useState, useEffect } from 'react';



const Overlays = {
    role: (props) => {
        return (
            <div style={{ left: `${parseInt(props.position.x)}px`, top: `${parseInt(props.position.y)}px` }}
                className="overlay flex">
                {
                    props.data.roles.sort((a, b) => a > b)
                        .map((v, i) =>
                            <span className={"flexing connection-container "}
                                key={i}>
                                <span onMouseDown={() => { props.resolve(v) }}
                                    className="connection">{v}</span>
                            </span>
                        )
                }
            </div>
        )
    },
    confirm: (props) => {
        return (
            <div style={{ left: `${parseInt(props.position.x)}px`, top: `${parseInt(props.position.y)}px` }}
                className="overlay text_center">
                <header>{props.data.text}</header>
                <button onMouseDown={() => { props.resolve(true) }}>confirm</button>
            </div>
        )
    },
    options: (props) => {
        return (
            <div style={{ left: `${parseInt(window.cursorPosition.x)}px`, top: `${parseInt(window.cursorPosition.y)}px` }}
                className="overlay text_center">
                <header>{props.data.text}</header>
                {
                    props.data.options.map(option =>
                        <button key={option} onMouseDown={() => { props.resolve(option) }}>{option}</button>
                    )
                }
            </div>
        )
    },
    option_groups: (props) => {
        return (
            <div style={{ left: `${parseInt(window.cursorPosition.x)}px`, top: `${parseInt(window.cursorPosition.y)}px` }}
                className="overlay group_overlay text_center center">
                <header>{props.data.title}</header>
                <div className="group_container">
                    {

                        Object.entries(props.data.options)
                            .map(([title, options]) =>
                                <div
                                    key={title}
                                    className='group'>
                                    <header className="group_title">{title}</header>
                                    <div>
                                        {
                                            options.map(option =>
                                                <button
                                                    key={title + option}
                                                    onMouseDown={() => {
                                                        props.resolve({ title, option })
                                                    }}>
                                                    {option}
                                                </button>

                                            )
                                        }
                                    </div>

                                </div>
                            )


                    }
                </div>


            </div>
        )
    }
}




export default Overlays