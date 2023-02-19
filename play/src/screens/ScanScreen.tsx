import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { Show } from '../components/utils/solid-like-components';

import FullScreenAndroid from 'react-native-fullscreen-chz';
import { useStore } from '../store/Store';

type Overlay = {
  message: string;
  yes: () => void;
  no?: () => void;
};

function ScanScreen({ onRead }: { onRead: (url: string) => void }) {
  const [state, actions] = useStore();

  const [overlay, setOverlay] = useState<Overlay | undefined>(undefined);

  const game_url_ref = useRef<string | undefined>(undefined);
  const scanner = useRef<QRCodeScanner | undefined>(undefined);

  useEffect(() => FullScreenAndroid.disable(), []);

  const openOverlay = ({ message, yes, no }: Overlay) => {
    setOverlay({
      message,
      yes: () => {
        if (yes) {
          yes();
        }
        setOverlay(undefined);
      },
      no: () => {
        if (no) {
          no();
        }
        setOverlay(undefined);
      },
    });
  };

  const processScanned = ({ data }: { data: string }) =>
    openOverlay({
      message: `open ${data}`,
      yes: () => actions.initGame(data),
      no: () => restartScan(),
    });

  const restartScan = () => {
    if (scanner.current?.reactivate) {
      setTimeout(scanner.current.reactivate, 1000);
    }
  };

  return (
    <View
      style={{
        height: '100%',
        display: 'flex',
      }}
    >
      <Show when={overlay}>
        <View
          style={{
            position: 'absolute',
            zIndex: 5,
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              padding: 15,
              paddingTop: 30,
              borderRadius: 25,
              backgroundColor: 'white',
              width: 300,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                paddingBottom: 20,
                color: 'black',
              }}
            >
              {overlay ? overlay.message : null}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
              }}
            >
              <Pressable
                onPress={overlay ? overlay.yes : null}
                style={{
                  height: 50,
                  fontSize: 15,
                  borderColor: 'grey',
                  borderWidth: 1,
                  borderRadius: 50,
                  margin: 5,
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'black',
                  }}
                >
                  yes
                </Text>
              </Pressable>
              <Pressable
                onPress={overlay ? overlay.no : null}
                style={{
                  height: 50,
                  borderColor: 'grey',
                  borderWidth: 1,
                  borderRadius: 50,
                  margin: 5,
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'black',
                  }}
                >
                  no
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Show>
      <View
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      >
        <QRCodeScanner
          ref={node => (scanner.current = node ?? undefined)}
          onRead={processScanned}
          cameraStyle={{
            transform: [{ scale: 1.2 }],
            width: '100%',
            height: '100%',
            borderRadius: 150,
          }}
        />
      </View>
      <View
        style={{
          height: '100%',
          padding: 10,
        }}
      >
        <Show when={state.previous_game_id && !state.instructions}>
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <Pressable
              onPress={() =>
                openOverlay({
                  message: `open ${state.previous_game_id}`,
                  yes: () => actions.initGame(state.previous_game_id!),
                })
              }
              title="yes"
              style={{
                height: 50,
                fontSize: 15,
                borderBottomColor: 'white',
                backgroundColor: 'white',
                textColor: 'black',
                borderRadius: 50,
                margin: 10,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  color: 'black',
                }}
              >
                open
              </Text>
              <Text
                style={{
                  textAlign: 'center',
                  color: 'black',
                }}
              >
                {state.previous_game_id}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                openOverlay({
                  message: `reload ${state.previous_game_id}`,
                  yes: () => actions.initGame(state.previous_game_id!, true),
                })
              }
              style={{
                height: 50,
                borderBottomColor: 'white',
                backgroundColor: 'white',
                borderRadius: 50,
                margin: 10,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  color: 'black',
                }}
              >
                reload
              </Text>
              <Text
                style={{
                  textAlign: 'center',
                  color: 'black',
                }}
              >
                {state.previous_game_id}
              </Text>
            </Pressable>
          </View>
        </Show>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
          }}
        >
          <TextInput
            onChangeText={(game_url: string) => (game_url_ref.current = game_url)}
            onSubmitEditing={() => onRead(game_url_ref.current)}
            placeholder="enter game-id"
            keyboardAppearance="dark"
            style={{
              paddingLeft: 20,
              color: 'black',
              borderRadius: 50,
              overflow: 'hidden',
              position: 'relative',
              zIndex: 99,
              backgroundColor: 'white',
              textColor: 'black',
              margin: 10,
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default ScanScreen;
