import React, { useEffect, useRef } from 'react';

export function Show<T>(props: { when: boolean; children: JSX.Element | JSX.Element[] }) {
  return props.when ? <>{props.children}</> : <></>;
}

export function For<T>(props: { each: T[]; children: (el: T, index: number) => JSX.Element }) {
  props.each.forEach(el => {
    if (!el) {
      console.error('THIS IS UNDEFINED');
    }
  });
  return <>{props.each ? props.each.map((el, index) => props.children(el, index)) : null}</>;
}

export const useMount = (func: () => void) => useRef(useEffect(func, []));
