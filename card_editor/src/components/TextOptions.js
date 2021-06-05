import { GUI_Panel, GUI_Category, GUI_Input, GUI_Select } from "./GUI_Components.js"
import React, { memo, useEffect, useCallback, useState, useRef } from 'react';

const TextOptions = ({ viewport, element }) => {

    useEffect(() => {
        console.log(element.options);
    }, [element]);

    const handleChange = useCallback((type, value) => {
        console.log(type, value);
        viewport.update(viewport.elementInFocus.state,
            {
                ...element,
                options: { ...element.options, [type]: value }
            }
        )
    }, [element, viewport])
    return <>
        <GUI_Panel label='Text Options'>
            <div className='flex-container'>
                <div className='main'>
                    <GUI_Category label='Font Options'>
                        <GUI_Select
                            label='Family'
                            data={['arial', 'times', 'custom']}
                            value={element.options.family}
                            onChange={value => { handleChange('family', value) }}
                        ></GUI_Select>
                        <GUI_Input
                            label='Size'
                            value={element.options.size}
                            onChange={value => { handleChange('size', value) }}
                        ></GUI_Input>
                        <GUI_Input
                            label='Line Height'
                            value={element.options.lineHeight}
                            onChange={value => { handleChange('lineHeight', value) }}
                        ></GUI_Input>
                        <GUI_Input
                            label='Spacing'
                            value={element.options.spacing}
                            min={-50}
                            onChange={value => { handleChange('spacing', value) }}
                        ></GUI_Input>
                        <GUI_Input
                            label='Color'
                            type='color'
                            value={element.options.color}
                            onChange={value => { handleChange('color', value) }}
                        ></GUI_Input>
                        <GUI_Category label='Alignment'>
                            <GUI_Select
                                label='Horizontal'
                                data={['left', 'center', 'right', 'justify']}
                                value={element.options.alignmentHorizontal}

                                onChange={value => { handleChange('alignmentHorizontal', value) }}

                            ></GUI_Select>
                            <GUI_Select
                                label='Vertical'
                                data={['flex-start', 'center', 'flex-end']}
                                value={element.options.alignmentVertical}

                                onChange={value => {
                                    handleChange('alignmentVertical', value)
                                }}
                            ></GUI_Select>
                        </GUI_Category>
                    </GUI_Category>
                </div>
                <div className='main'>

                    <GUI_Category label='Text Shadow'>
                        <GUI_Input
                            label='left'
                            value={element.options.shadowLeft}
                            onChange={value => { handleChange('shadowLeft', value) }}
                        ></GUI_Input>
                        <GUI_Input
                            label='top'
                            value={element.options.shadowTop}
                            onChange={value => { handleChange('shadowTop', value) }}
                        ></GUI_Input>
                        <GUI_Input
                            label='blur'
                            value={element.options.shadowBlur}
                            onChange={value => { handleChange('shadowBlur', value) }}
                        ></GUI_Input>
                        <GUI_Input
                            label='color'
                            type='color'
                            value={element.options.shadowColor}
                            onChange={value => { handleChange('shadowColor', value) }}
                        ></GUI_Input>
                    </GUI_Category>
                </div>


            </div>
        </GUI_Panel>
    </>
}

export default TextOptions