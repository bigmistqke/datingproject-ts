import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Dimensions, Pressable, Animated, PanResponder, View, Text, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import Tweener from "../helpers/tweener.js";



const Swipe = ({ screen_dimensions, card_dimensions, zIndex, canPlay, canSwipe, onSwipe, triggerSwipe, waitYourTurn, margin, children, flip }) => {

  const tweener = useRef(new Tweener()).current;
  const DRAG_TRESHOLD = useRef(100).current;
  // TODO : replacement for windows in react-native
  /*     let screen_dimensions = useRef({
          x: Dimensions.get('window').width,
          y: Dimensions.get('window').height
      }).current; */





  const pan_ref = useRef(new Animated.ValueXY()).current;
  const translate_ref = useRef(new Animated.ValueXY()).current;

  let translate_start_ref = useRef().current;

  const rotateZ = useRef(new Animated.Value(0)).current;
  const rotateZ_ref = rotateZ.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1deg']
  })




  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      console.log("START TOUCH?");
      translate_start_ref = {
        x: translate_ref.x._value,
        y: translate_ref.y._value
      }
      pan_ref.setOffset({
        x: pan_ref.x._value,
        y: pan_ref.y._value
      });
    },
    onPanResponderMove: Animated.event([
      null, { dx: pan_ref.x, dy: pan_ref.y }
    ], {
      useNativeDriver: false,
      listener: (event, gestureState) => {
        translate_ref.setValue({
          x: translate_start_ref.x + pan_ref.x._value,
          y: translate_start_ref.y + pan_ref.y._value
        });
        rotateZ.setValue(2 * (translate_ref.x._value) / screen_dimensions.x * 30);
      }
    }),
    onPanResponderRelease: () => {
      pan_ref.flattenOffset();
      if (Math.sqrt(
        Math.pow(translate_ref.x._value, 2) + Math.pow(translate_ref.y._value, 2)
      ) < DRAG_TRESHOLD) {
        snapBack();
      } else {
        swipeAway();
        onSwipe();
      }



    }
  })).current;

  const swipeAway = useCallback(() => {
    translate_start_ref = {
      x: translate_ref.x._value,
      y: translate_ref.y._value
    }
    const angle = Math.atan2(translate_start_ref.y, translate_start_ref.x)
    const new_dist = {
      x: screen_dimensions.x * 1.75 * Math.cos(angle),
      y: screen_dimensions.y * 1.25 * Math.sin(angle)
    }
    tweener.tweenTo(0, 1, 500,
      (alpha) => {
        translate_ref.setValue({
          x: translate_start_ref.x * (1 - alpha) + (new_dist.x) * alpha,
          y: translate_start_ref.y * (1 - alpha) + (new_dist.y) * alpha,
        })
        rotateZ.setValue(2 * (translate_ref.x._value) / screen_dimensions.x * 30);
      }
    )
  }, [])

  const snapBack = useCallback(() => {
    translate_start_ref = {
      x: translate_ref.x._value,
      y: translate_ref.y._value
    }
    tweener.tweenTo(1, 0, 250,
      (alpha) => {
        translate_ref.setValue({
          x: translate_start_ref.x * alpha,
          y: translate_start_ref.y * alpha
        });
        rotateZ.setValue(2 * (translate_ref.x._value) / screen_dimensions.x * 30);
      }
    );
  }, [])



  return (
    <View>
      <Animated.View
        style={{
          left: margin * 10,
          top: margin * 10,
          position: 'absolute',
          elevation: 10,
          height: parseInt(card_dimensions.y),
          width: parseInt(card_dimensions.x),
          transform: [
            { translateX: translate_ref.x },
            { translateY: translate_ref.y },
            { rotateZ: rotateZ_ref },
          ],

        }}
        {...panResponder.panHandlers}
      >
        {children}

      </Animated.View>
    </View >
  );
}



export default Swipe;