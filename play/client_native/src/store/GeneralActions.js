import MMKVStorage from "react-native-mmkv-storage";
const MMKV = new MMKVStorage.Loader().initialize();
import urls from "../urls";
import RNFS from "react-native-fs";
import { useMemo } from "react";
import isColor from "../helpers/isColor";
import React from "react";

import { Dimensions, StatusBar, Image } from 'react-native';
import { log, error } from "../helpers/log"


// import { SvgCss } from "react-native-svg";

export default function GeneralActions({ state, ref, actions }) {

  this.setInstructions = (instructions) => state.instructions.set(instructions);
  this.setIds = (ids) => state.ids.set(ids);
  this.setDesign = (design) => state.design.set(design);

  this.initGame = async (game_id) => {
    try {
      log("game_id ", game_id);
      await MMKV.setStringAsync("game_id", game_id);

      let result = await this.joinRoom(game_id);
      if (!result || !result.success) throw "joinRoom did not succeed ";

      let { instructions, role_id, room_id, player_id, design, design_id } = result;

      const STATUS_HEIGHT = StatusBar.currentHeight || 24;

      state.viewport.window_size.set({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height - STATUS_HEIGHT
      })

      state.game_start.set(new Date().getTime());

      this.setDesign(design);
      actions.updateCardSize();
      this.setIds({
        player: player_id,
        role: role_id,
        room: room_id,
      });

      actions.initSocket();

      // IMPORTANT: both downloadVideos mutate instructions (sets url to local file-path)!
      await downloadVideos(instructions);

      log("instructions are ", instructions);

      let design_uploaded = await MMKV.getStringAsync(`${design_id}_modified`);
      log("design_uploaded: ", design_uploaded, " | ", design.modified);

      if (!design_uploaded || parseInt(design_uploaded) < parseInt(design.modified)) {
        await downloadDesignElements({ design, design_id });
        await MMKV.setStringAsync(`${design_id}_modified`, String(new Date().getTime()));
      }
      // await preloadDesignElements(design);
      state.viewport.loading_percentage.set(false);
      this.setInstructions(instructions);
    } catch (err) {
      console.error(err);
      return false
    }

  }

  this.checkCachedGameId = async () => {
    const previous_game_id = await MMKV.getStringAsync("game_id");

    state.previous_game_id.set(previous_game_id)
  }

  this.getPreviousGameId = () => ref.previous_game_id;


  this.joinRoom = async (game_id) => {
    let result;
    try {
      result = await fetch(`${urls.fetch}/api/room/join/${game_id}`).catch(err => log(err));
      if (!result) {
        return { success: false, error: 'could not fetch instructions: double check the url' };
      }
      result = await result.json();
      return result;
    } catch (err) {
      return { success: false, error: "ERROR while joining room:", err };
    }
  }

  const preloadDesignElements = async (design) => {
    const base_url = RNFS.DocumentDirectoryPath + '/designs';

    const svgs = Object.values(design.types).map(
      type => type.filter(element => element.type === 'svg')
    ).reduce((a, b) => a.concat(b));
    for (let svg of svgs) {
      let filename = `${svg.id}_normal.png`;
      await Image.getSize(filename);
      filename = `${svg.id}_masked.png`;
      await Image.getSize(filename);
    }
  }

  const downloadDesignElements = async ({ design, design_id }) => {
    try {
      log("PRELOAD DESIGN ELEMENTS");

      const base_url = RNFS.DocumentDirectoryPath + '/designs';

      if (!(await RNFS.exists(base_url)))
        await RNFS.mkdir(base_url);

      const svgs = Object.values(design.types).map(
        type => type.filter(element => element.type === 'svg')
      ).reduce((a, b) => a.concat(b));

      let promises = [];

      for (let svg of svgs) {
        svg.url = {};
        promises.push(new Promise((resolve, reject) => {
          let filename = `${svg.id}_normal.png`;
          RNFS.downloadFile({
            fromUrl: `${urls.fetch}/api/designs/${design_id}/${filename}`,
            toFile: `${base_url}/${filename}`
          }).promise.then((result) => {
            log("DOWNLOADED ", `${urls.fetch}/api/designs/${design_id}/${filename}`, result);
            resolve();
          });
        }))
        promises.push(new Promise((resolve, reject) => {
          let filename = `${svg.id}_masked.png`;
          RNFS.downloadFile({
            fromUrl: `${urls.fetch}/api/designs/${design_id}/${filename}`,
            toFile: `${base_url}/${filename}`
          }).promise.then(resolve);
        }))
      }
      return Promise.all(promises);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const downloadVideos = async (instructions) => {
    try {
      const base_url = RNFS.DocumentDirectoryPath + '/videos';
      let promises = [];
      let progresses = {};

      const updateProgress = () => {
        let total_progress = Object.values(progresses).reduce((a, b) => a + b, 0) / Object.values(progresses).length;
        state.viewport.loading_percentage.set(total_progress);
      }

      if (!(await RNFS.exists(RNFS.DocumentDirectoryPath + '/videos'))) {
        RNFS.mkdir(base_url)
      }

      let videos = instructions.filter(instruction => instruction.type === "video")

      for (const video of videos) {
        promises.push(new Promise(async (resolve, reject) => {
          const filename = video.text.split("/")[(video.text.split("/").length - 1)];
          const to_path = `${base_url}/${filename}`;

          if (await RNFS.exists(to_path)) {
            let { mtime } = await RNFS.stat(to_path);
            log(new Date(mtime).getTime(), video.modified);
            if (new Date(mtime).getTime() > video.modified) {
              video.url = `${base_url}/${filename}`;
              resolve();
              return;
            }
          }

          RNFS.downloadFile({
            fromUrl: `${urls.fetch}${video.text}`,
            toFile: `${base_url}/${filename}`,
            progress: (e) => {
              const percentComplete = ((e.bytesWritten / e.contentLength) * 100 | 0) + '%';
              progresses[video.instruction_id] = parseInt(percentComplete);
              updateProgress();
            },
          }).promise.then(async (r) => {
            log("SET VIDEO URL TO ", `${base_url}/${filename}`)
            video.url = `${base_url}/${filename}`;
            resolve();
          });
        }))
      }

      return Promise.all(promises);
    } catch (err) {
      console.error(err);
      return false;
    }

  }
}