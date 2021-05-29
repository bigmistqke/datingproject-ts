import React, { memo, useEffect, useCallback, useState, useRef } from 'react';

const Guide = ({ guides, id, guide, card_dim, shouldSnap }) => {
    const startCursor = useCallback(e => {
        if (guides.locked.state) return;
        e.preventDefault();
        e.stopPropagation();

        const update = e => {
            guide.position = guide.direction === 'horizontal' ?
                (e.clientY - card_dim.y) / card_dim.height * 100 :
                (e.clientX - card_dim.x) / card_dim.width * 100;

            guide.position = shouldSnap && Math.abs(guide.position - 50) < 3 ? 50 : guide.position;

            guides.update(id, guide);
        }

        const finish = e => {
            console.log(guide.position);
            if (guide.position < 0 || guide.position > 100) {
                guides.delete(id);
            }
            window.removeEventListener('mousemove', update, true);
            window.removeEventListener('mouseup', finish, true);
        }
        window.addEventListener('mousemove', update, true);
        window.addEventListener('mouseup', finish, true);
    }, [guides, shouldSnap])

    return guide.direction === 'horizontal' ?
        <div
            className='guide horizontal'
            onMouseDown={startCursor}
            style={{ top: guide.position + "%", left: card_dim.x * -1, pointerEvents: guides.locked.state ? 'none' : 'auto' }}
        ></div> :
        <div
            className='guide vertical'
            onMouseDown={startCursor}
            style={{ left: guide.position + "%", top: card_dim.y * -1, pointerEvents: guides.locked.state ? 'none' : 'auto' }}
        ></div>
}

const Guides = ({ card_dim, shouldSnap, guides }) => {
    return (
        <div className='guides'>
            {
                Object.entries(guides.state).map(([key, guide]) =>
                    <Guide
                        card_dim={card_dim}
                        guide={guide}
                        key={key}
                        id={key}
                        guides={guides}
                        shouldSnap={shouldSnap}
                    ></Guide>
                )
            }
        </div>
    )
}

export default Guides