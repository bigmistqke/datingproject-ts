import React, { memo, useEffect, useCallback, useState, useRef } from 'react';
import { GUI_Panel, GUI_Category, GUI_Input } from "./GUI_Components.js"
import uniqid from 'uniqid';


const LayOut = ({ guides, card_dim, viewport }) => {
    const [layout, setLayout] = useState({
        horizontal: {
            amount: 0,
            padding: 0,
        },
        vertical: {
            amount: 0,
            padding: 0
        }
    })

    const createLayout = useCallback((shouldAdd) => {
        let h_amount = layout.horizontal.amount;
        let h_padding = layout.horizontal.padding / 10;
        let v_amount = layout.vertical.amount;
        let v_padding = layout.vertical.padding / 10 * card_dim.height / card_dim.width;

        const _guides = [];

        if (h_padding == 0) {
            for (let i = 0; i < (h_amount + 2); i++) {
                let guide = {
                    direction: 'horizontal',
                    position: i * 100 / (h_amount + 1),
                    key: uniqid()
                }
                _guides.push(guide);
            }
        } else {
            h_amount = h_amount * 2;

            for (let i = 0; i < (h_amount + 2); i++) {
                let guide = {
                    direction: 'horizontal',
                    position: i === 0 || i === h_amount + 1 ?
                        i * 100 / (h_amount + 1) :
                        i % 2 == 0 ?
                            i / 2 * 100 / (h_amount / 2 + 1) + h_padding :
                            (i + 1) / 2 * 100 / (h_amount / 2 + 1) - h_padding,
                    key: uniqid()
                }
                _guides.push(guide);
            }
        }

        if (v_padding == 0) {

            for (let i = 0; i < (v_amount + 2); i++) {
                let guide = {
                    direction: 'vertical',
                    position: i * 100 / (v_amount + 1),
                    key: uniqid()
                }
                _guides.push(guide);
            }
        } else {
            v_amount = v_amount * 2;

            for (let i = 0; i < (v_amount + 2); i++) {
                let guide = {
                    direction: 'vertical',
                    position: i === 0 || i === v_amount + 1 ?
                        i * 100 / (v_amount + 1) :
                        i % 2 == 0 ?
                            i / 2 * 100 / (v_amount / 2 + 1) + v_padding :
                            (i + 1) / 2 * 100 / (v_amount / 2 + 1) - v_padding,
                    key: uniqid()
                }
                console.log(guide.position);
                _guides.push(guide);
            }
        }
        guides.updateAll(_guides);

    }, [layout, guides])

    const handleChange = useCallback((data) => {
        setLayout({ ...data });
    })

    useEffect(() => {
        createLayout()
    }, [])


    return (<>
        <GUI_Panel label='Guide LayOut' data={layout}>
            <div style={{ display: 'flex' }}>
                {
                    Object.entries(layout).map(([categoryName, viewport]) =>
                        <GUI_Category key={categoryName} label={categoryName} >
                            {
                                Object.entries(viewport).map(([elementName, element]) =>
                                    <GUI_Input
                                        key={elementName}
                                        label={elementName}
                                        value={element}
                                        onChange={
                                            (data) => {
                                                let _category = { ...viewport, [elementName]: data };
                                                setLayout({ ...layout, [categoryName]: _category });
                                            }}
                                    >
                                    </GUI_Input>
                                )
                            }
                        </GUI_Category>
                    )
                }
            </div>

        </GUI_Panel>
        <div className='flex-container button-container'>
            <button onClick={() => { createLayout(true) }}>create</button>
            <button onClick={() => { guides.locked.update(!guides.locked.state) }}>{guides.locked.state ? 'unlock guides' : 'lock guides'}</button>
        </div>
        <div className='flex-container button-container'>
            <button onClick={() => { guides.hidden.update(!guides.hidden.state) }}>{guides.hidden.state ? 'show guides' : 'hide guides'}</button>
            <button onClick={() => { viewport.blurredBorder.update(!viewport.blurredBorder.state) }}>{!viewport.blurredBorder.state ? 'show borders' : 'hide borders'}</button>

        </div>
    </>)
}
export default LayOut