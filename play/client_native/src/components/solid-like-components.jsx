import React, {useEffect} from 'react';

export function Show(props) {
  return props.when ? props.children : null;
}

export function For(props) {
  props.each.forEach(el => {
    if (!el) {
      console.error('THIS IS UNDEFINED');
    }
  });
  return (
    <>
      {props.each
        ? props.each.map((el, index) => props.children(el, index))
        : null}
    </>
  );
}
