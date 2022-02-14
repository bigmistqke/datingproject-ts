import MMKVStorage from "react-native-mmkv-storage";
const MMKV = new MMKVStorage.Loader().initialize();
import urls from "../urls";
import RNFS from "react-native-fs";
import { useMemo } from "react";
import isColor from "../helpers/isColor";
import React from "react";

import { Dimensions, StatusBar, Image } from 'react-native';
import { log, error } from "../helpers/log"

import NetInfo from "@react-native-community/netinfo";

import Sound from "react-native-sound";
// import { SvgCss } from "react-native-svg";

export default function GeneralActions({ state, ref, actions }) {
  Sound.setCategory('Playback');

  this.setInstructions = (instructions) => state.instructions.set(instructions);
  this.setIds = (ids) => state.ids.set(ids);
  this.setDesign = (design) => state.design.set(design);

  this.setWindowSize = ({ width, height }) =>
    state.viewport.window_size.set({ width, height })

  this.initNetInfo = () => {
    NetInfo.addEventListener(connection => {


      if (connection.type === 'none') {
        // alert("device offline");
      } else {
        if (ref.connection === 'none') {
          actions.reconnectSocket();
        }
      }

      state.connection.set(connection.type);
    });
  }

  this.setMode = (mode) => {
    console.log(mode);
    state.mode.set(mode)
  }

  this.initGame = async (game_id, ignore_cache = false) => {
    try {
      this.setMode("load")
      // this.setInstructions([]);
      state.timers.set({});
      await MMKV.setStringAsync("game_id", game_id);
      state.received_instruction_ids.set([]);

      let {
        instructions,
        _instructions,
        role_id,
        room_id,
        player_id,
        design,
        design_id,
        instruction_index,
        sound,
        autoswipe,
        success
      } = await this.joinRoom(game_id);

      console.log(design);

      if (!success) throw "joinRoom did not succeed "
      if (!instructions) throw "INSTRUCTIONS IS NULL"

      state.game_start.set(new Date().getTime());
      state.autoswipe.set(autoswipe);

      this.setDesign(design);
      actions.updateCardSize(design);

      this.setIds({
        player: player_id,
        role: role_id,
        room: room_id,
        game: game_id
      });

      if (!ref.bools.isInitialized)
        actions.initSocket()

      // IMPORTANT: both downloadVideos mutate instructions (sets url to local file-path)!
      await Promise.all([
        downloadVideos(instructions, ignore_cache),
        downloadDesignElements({ design, design_id, ignore_cache }),
        downloadSound(sound),
      ])




      state.viewport.loading_percentage.set(false);

      state.instructions.set(instructions);

      state._instructions.set(JSON.stringify(_instructions));

      state.instruction_index.set(instruction_index);

      state.bools.isInitialized.set(true);

      this.setMode("play")
    } catch (err) {
      console.error("ERROR WHILE INITIGAME", err);
      state.viewport.loading_error.set(err);
      setTimeout(() => {
        actions.setMode("new")
      }, 3000)
      return false
    }



  }

  this.checkCachedGameId = async () => {
    const previous_game_id = await MMKV.getStringAsync("game_id");
    state.previous_game_id.set(previous_game_id);
    return previous_game_id;
  }

  this.getPreviousGameId = () => ref.previous_game_id;



  this.joinRoom = async (game_id) => {
    console.log("JOIN ROOM!!", game_id);
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

  const downloadSound = async (filename) => {
    try {
      const base_url = RNFS.DocumentDirectoryPath + '/sounds';
      if (!(await RNFS.exists(base_url)))
        await RNFS.mkdir(base_url);

      await RNFS.downloadFile({
        fromUrl: `${urls.fetch}/api/sounds/${filename}?${new Date().getTime()}`,
        toFile: `${base_url}/${filename}`
      }).promise;

      state.sound.set(`${base_url}/${filename}`);
      var ping = new Sound(filename, base_url, (error) => {
        console.log('preloaded sound');
        if (error) throw error;
        ping.setVolume(0);
        ping.play(success => {
          if (!success) return;
          state.sound.set(ping);
          ping.setVolume(1);
        })
      });
    } catch (error) {
      console.error('error while downloading sound', error);
      return { error };
    }


  }


  const downloadWithProgress = ({
    from_path, to_path, modified, ignore_cache
  }) =>
    new Promise(async (resolve, reject) => {

      if (await RNFS.exists(to_path)) {
        let stat = await RNFS.stat(to_path);
        if (
          !ignore_cache &&
          (modified && new Date(stat.mtime).getTime() > modified)
        ) {
          resolve();
          return;
        }
      }

      RNFS.downloadFile({
        fromUrl: from_path,
        toFile: to_path,
        progress: (e) => {
          console.log(e.contentLength);
          progresses[to_path] = [e.bytesWritten, e.contentLength];
          updateProgress();
        },
      }).promise.then((result) => {
        resolve();
      });
    })



  const downloadDesignElements = async ({ design, design_id, ignore_cache }) => {
    try {
      console.log(design);
      const base_url = RNFS.DocumentDirectoryPath + '/designs';

      if (!(await RNFS.exists(base_url)))
        await RNFS.mkdir(base_url);

      const svgs = Object.values(design.types).map(
        type => type.filter(element => element.type === 'svg')
      ).reduce((a, b) => a.concat(b));

      let promises = [];

      for (let svg of svgs) {
        promises.push(downloadWithProgress({
          from_path: `${urls.fetch}/api/designs/${design_id}/${svg.id}_normal.png?${new Date().getTime()}`,
          to_path: `${base_url}/${svg.id}_normal.png`,
          modified: design.modified,
          ignore_cache
        }))
        promises.push(downloadWithProgress({
          from_path: `${urls.fetch}/api/designs/${design_id}/${svg.id}_masked.png?${new Date().getTime()}`,
          to_path: `${base_url}/${svg.id}_masked.png`,
          modified: design.modified,
          ignore_cache
        }))
        /* promises.push(new Promise(async (resolve, reject) => {



          let filename = `${svg.id}_normal.png`;
          let to_file = `${base_url}/${filename}`;

          if (await RNFS.exists(to_file)) {
            let stat = await RNFS.stat(to_file);

            if (
              !ignore_cache &&
              (design.modified && new Date(stat.mtime).getTime() > design.modified)
            ) {
              resolve();
              return;
            }
          }

          RNFS.downloadFile({
            fromUrl: `${urls.fetch}/api/designs/${design_id}/${filename}?${new Date().getTime()}`,
            toFile,
            progress: (e) => {
              console.log(e.contentLength);
              progresses[filename] = [e.bytesWritten, e.contentLength];
              updateProgress();
            },
          }).promise.then((result) => {
            resolve();
          });
        }))
        promises.push(new Promise((resolve, reject) => {
          let filename = `${svg.id}_masked.png`;
          console.log('downloading', filename);

          RNFS.downloadFile({
            fromUrl: `${urls.fetch}/api/designs/${design_id}/${filename}?${new Date().getTime()}`,
            toFile: `${base_url}/${filename}`,
            progress: (e) => {
              progresses[filename] = [e.bytesWritten, e.contentLength];
              updateProgress();
            },
          }).promise.then(() => {
            console.log('downloaded', filename);
            resolve();
          });
        })) */
      }
      return Promise.all(promises);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  let progresses = {};

  const updateProgress = () => {
    let total_progress = Object.values(progresses).reduce((a, b) => [a[0] + b[0], a[1] + b[1]]).reduce((a, b) => a / b * 100);
    state.viewport.loading_percentage.set(total_progress);
  }

  const downloadVideos = async (instructions, ignore_cache) => {
    const base_url = RNFS.DocumentDirectoryPath + '/videos';


    const downloadVideo = (video) =>
      new Promise(async (resolve, reject) => {
        try {
          console.log("DOWNLOAD VIDEO!!!!!", ignore_cache);
          const filename = video.text.split("/")[(video.text.split("/").length - 1)];
          const postername = filename.replace(filename.split(".").pop(), "jpg");

          const to_path = `${base_url}/${filename}`;

          if (await RNFS.exists(to_path)) {
            let stat = await RNFS.stat(to_path);

            console.log('video', video.filesize, stat.size, parseInt(video.filesize) === stat.size)
            if (
              !ignore_cache &&
              parseInt(video.filesize) === stat.size &&
              (!video.modified || new Date(stat.mtime).getTime() > video.modified)
            ) {
              resolve();
              return;
            }
          }

          let video_response = await RNFS.downloadFile({
            fromUrl: `${urls.fetch}${video.text}`,
            toFile: `${base_url}/${filename}`,
            progress: (e) => {
              progresses[filename] = [e.bytesWritten, e.contentLength];
              updateProgress();
            },
          }).promise;

          if (video_response.statusCode !== 200) { // Or something else, basically a check for failed responses
            throw `error while downloading ${filename}`
          } else {
            resolve(true);
          }
        } catch (err) {
          console.error(err);
          resolve(false);
        }

      })


    try {
      if (!(await RNFS.exists(RNFS.DocumentDirectoryPath + '/videos'))) {
        RNFS.mkdir(base_url)
      }

      let videos = instructions.filter(instruction => instruction.type === "video")
      let promises = videos.map(video => downloadVideo(video));
      return Promise.all(promises)
    } catch (err) {
      console.error(err);
      // alert(err);
      return false;
    }

  }
}