import MMKVStorage from "react-native-mmkv-storage";
const MMKV = new MMKVStorage.Loader().initialize();
import urls from "../urls";
import RNFS from "react-native-fs";
import { useMemo } from "react";
import isColor from "../helpers/isColor";
import React from "react";

// import { SvgCss } from "react-native-svg";

export default function GeneralActions({ state, setState, actions, ref }) {
  this.getId = (type) => state.ids[type];

  this.initGame = async (game_id) => {

    try {
      console.log('initGame!');
      await MMKV.setStringAsync("game_id", game_id);
      let result = await this.joinRoom(game_id);

      console.log('initGame!', result);


      if (!result || !result.success) throw "joinRoom did not succeed ";

      let { instructions, role_id, room_id, player_id, design, design_id } = result;

      console.log(instructions);

      actions.setDesign(design);
      actions.updateCardSize();
      actions.setIds({
        player: player_id,
        role: role_id,
        room: room_id,
      });

      actions.initSocket();

      // IMPORTANT: both preloadVideos and processSVGs mutate instructions!
      await preloadVideos(instructions);
      await preloadDesignElements({ design, design_id });


      actions.setInstructions(instructions);
    } catch (e) {

    }

  }

  this.checkCachedGameId = async () => {
    previous_game_id = await MMKV.getStringAsync("game_id");
    setState('previous_game_id', previous_game_id);
  }

  this.getPreviousGameId = () => state.previous_game_id;


  this.joinRoom = async (game_id) => {
    let result;
    try {
      result = await fetch(`${urls.fetch}/api/room/join/${game_id}`);
      console.log("result of fetch is ", result);
      if (!result) {
        return { success: false, error: 'could not fetch instructions: double check the url' };
      }
      result = await result.json();
      return result;
    } catch (err) {
      return { success: false, error: "ERROR while joining room:", err };
    }
  }


  const preloadDesignElements = async ({ design, design_id }) => {
    let base_url = RNFS.DocumentDirectoryPath + '/designs';
    console.log(base_url);
    if (!(await RNFS.exists(base_url))) RNFS.mkdir(base_url);

    const svgs = Object.values(design.types).map(type => type.filter(element => {
      return element.type === 'svg'
    })).reduce((a, b) => a.concat(b));

    let promises = [];

    for (let svg of svgs) {
      svg.url = {};
      promises.push(new Promise((resolve, reject) => {
        let filename = `${svg.id}_normal.png`;
        console.log(`${urls.fetch}/api/designs/${design_id}/${filename}`, `${base_url}/${filename}`)
        RNFS.downloadFile({
          fromUrl: `${urls.fetch}/api/designs/${design_id}/${filename}`,
          toFile: `${base_url}/${filename}`
        }).promise.then(async (r) => {
          svg.url.normal = `${base_url}/${filename}`;
          resolve();
        });
      }))
      promises.push(new Promise((resolve, reject) => {
        let filename = `${svg.id}_masked.png`;
        RNFS.downloadFile({
          fromUrl: `${urls.fetch}/api/designs/${design_id}/${filename}`,
          toFile: `${base_url}/${filename}`
        }).promise.then(async (r) => {
          svg.url.masked = `${base_url}/${filename}`;
          resolve();
        });
      }))
    }

    return Promise.all(promises);
  }

  const preloadVideos = async (instructions) => {
    const base_url = RNFS.DocumentDirectoryPath + '/videos';
    let promises = [];
    let progresses = {};

    const updateProgress = () => {
      let total_progress = Object.values(progresses).reduce((a, b) => a + b, 0) / Object.values(progresses).length;
      console.info('total_progress ', total_progress);
    }

    if (!(await RNFS.exists(RNFS.DocumentDirectoryPath + '/videos'))) {
      RNFS.mkdir(base_url)
    }

    let videos = instructions.filter(instruction => instruction.type === "video")

    for (let video of videos) {
      promises.push(new Promise((resolve, reject) => {
        let filename = video.text.split("/")[(video.text.split("/").length - 1)];

        RNFS.downloadFile({
          fromUrl: `${urls.fetch}${video.text}`,
          toFile: `${base_url}/${filename}`,
          progress: (e) => {
            const percentComplete = ((e.bytesWritten / e.contentLength) * 100 | 0) + '%';
            progresses[video.instruction_id] = parseInt(percentComplete);
            updateProgress();
          },
        }).promise.then(async (r) => {
          video.url = `${base_url}/${filename}`;
          resolve();
        });
      }))
    }

    return Promise.all(promises);
  }
}