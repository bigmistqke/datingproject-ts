import React, { useRef } from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

import Text from '../components/AppText';

import { useStore } from '../store/Store';

function OpenScreen({ onRead }) {
  const [state, actions] = useStore();

  const View = styled.View`
    position: relative;
  `;

  return (
    <View
      style={{
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={() => actions.initGame(state.previous_game_id!)}
            style={{
              height: 75,
              borderBottomColor: 'white',
              backgroundColor: 'white',
              borderRadius: 50,
              paddingRight: 50,
              paddingLeft: 50,
            }}
          >
            <Text
              style={{
                height: '100%',
                fontSize: 25,
                textAlign: 'center',
                textAlignVertical: 'center',
                color: 'black',
              }}
            >
              {`CONTINUE GAME!`}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => actions.setMode('new')}
        style={{
          height: 35,
          borderBottomColor: 'white',
          backgroundColor: 'transparent',
          borderRadius: 50,
          margin: 10,
          flex: 0,
        }}
      >
        <Text
          style={{
            height: '100%',
            textAlign: 'center',
            textAlignVertical: 'center',
            color: 'black',
          }}
        >
          OPEN NEW GAME
        </Text>
      </Pressable>
    </View>
  );
}

export default OpenScreen;
