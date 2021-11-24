import React, { memo, useEffect, useCallback, useState, useRef } from 'react';


const GUI_Select = ({ label, value, data, type = 'number', onChange }) => {

    const handleChange = (event) => {
        onChange(event.target.value);
    }

    return (
        <div className='flex-container gui-row'>
            <label className='main'>{label} </label>
            <select
                key={label}

                value={value}
                type={type}
                onChange={handleChange}
            >
                {
                    data.map(v =>
                        <option key={v} value={v}>{v}</option>
                    )
                }
            </select>
        </div>
    )
}

const GUI_Input = ({ label, value, type = 'number', onChange, min = 0, max = 1000 }) => {

    const handleChange = event => {
        onChange(type === 'number' ? parseInt(event.target.value) : event.target.value);
    }

    return (
        <div className='flex-container gui-row'>
            <label className='main'>{label} </label>
            <input
                key={label}
                value={value}
                type={type}
                onChange={handleChange}
            ></input>
        </div>
    )
}

const GUI_Category = ({ label, data, onChange, children }) => {
    let r_data = useRef({ ...data });

    const handleChange = (_key, _value) => {
        r_data.current[_key] = _value;
        onChange(label, { ...r_data.current });
    }

    return (
        <div style={{ flex: 1 }}>
            <h2>{label}</h2>
            {
                children
            }
        </div>
    )
}

const GUI_Panel = ({ label, data, onChange, children }) => {
    let r_data = useRef({ ...data });

    const handleChange = (_key, _value) => {
        r_data.current[_key] = _value;
        onChange(label, { ...r_data.current });
    }

    return <>
        <h1>{label}</h1>
        {
            children
        }
    </>
}

const GUI_Container = ({ label, data, children }) => {
    let r_data = useRef({ ...data });

    return <>
        <h1>{label}</h1>
        {
            children
        }
    </>
}

export {
    GUI_Input,
    GUI_Category,
    GUI_Panel,
    GUI_Container,
    GUI_Select
}