import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

const LoadingScreen = function ({ instructions }) {
    const [progress, setProgress] = useState();

    useEffect(() => {
        preloadVideos(instructions.filter(i => i.type === 'video'));
    }, [instructions])

    const preloadVideos = async (video_instructions) => {
        let promises = [];
        let progresses = {};

        const updateProgress = () => {
            let total_progress = Object.values(progresses).reduce((a, b) => a + b, 0) / Object.values(progresses).length;
            setProgress(parseInt(total_progress));
        }
        for (let instruction of video_instructions) {
            promises.push(new Promise((resolve, reject) => {
                var xhrReq = new XMLHttpRequest();
                xhrReq.open('GET', `${window._url.fetch}${instruction.text}`, true);
                xhrReq.responseType = 'blob';
                xhrReq.onload = function () {
                    if (this.status === 200) {
                        console.error('storing videos in localStorage not implemented');
                    } else {
                        console.error('video could not load!!!!!');
                    }
                    resolve();
                }
                xhrReq.onerror = function () {
                    console.error('err', arguments);
                    resolve();
                }
                xhrReq.onprogress = function (e) {
                    if (e.lengthComputable) {
                        const percentComplete = ((e.loaded / e.total) * 100 | 0) + '%';
                        progresses[instruction.instruction_id] = parseInt(percentComplete);
                        updateProgress();
                    }
                }
                xhrReq.send();
            }))
        }
        return Promise.all(promises);
    }

    return (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
            <div>{progress}%</div>
        </View>
    )
}

export default LoadingScreen