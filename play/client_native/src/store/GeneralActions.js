import MMKVStorage from "react-native-mmkv-storage";
const MMKV = new MMKVStorage.Loader().initialize();
import urls from "../urls";
import RNFS from "react-native-fs";
import { useMemo } from "react";
import isColor from "../helpers/isColor";
import React from "react";

import { SvgCss } from "react-native-svg";

export default function GeneralActions({ state, setState, actions, ref }) {
  this.getId = (type) => state.ids[type];

  this.initGame = async (game_id) => {
    await MMKV.setStringAsync("game_id", game_id);
    let result = await this.joinRoom(game_id);

    if (!result || !result.success) {
      console.error("joinRoom did not succeed : ", result.error);
      return;
    };

    let { instructions, role_id, room_id, player_id, design } = result;

    // mutates design!
    // inlines all styles in the SVGs at the moment
    // maybe later on i will flatten styles of other objects too
    // (get rid of global-local distinction)
    // ((unsure if i should do this at editor or server-level instead))
    this.flattenDesign(design);

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
    actions.setInstructions(instructions);
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
      if (!result) {
        return { success: false, error: 'could not fetch instructions: double check the url' };
      }
      result = await result.json();
      return result;
    } catch (err) {
      return { success: false, error: "ERROR while joining room:", err };
    }
  }


  const flattenSVG = ({ element, swatches }) => {
    let styles = element.styles;
    let processed_svg = {
      masked: element.svg,
      normal: element.svg
    }

    for (let mask_mode in processed_svg) {


      let new_style_string = "<style>";

      Object.entries(styles).forEach(([name, style]) => {
        let string = ` .${name} {\n`;
        Object.entries(style).forEach(([key, value]) => {
          if (key === "fill" || key === "stroke") {
            if (value === "none") {
              // string += `${key}:transparent !important; `;
            } else {
              string += `${key}:${isColor(value) ? value : swatches[value][mask_mode]
                }  !important;\n`;
            }
          } else {
            string += `${key}:${value}; `;
          }
        });
        string += "}\n";
        new_style_string += string;
      });
      new_style_string += "</style>";

      // console.log(processed_svg[mask_mode].replace(/<style.*.<\/style>/gs, new_style_string));
      processed_svg[mask_mode] = processed_svg[mask_mode].replace(/<style.*.<\/style>/gs, new_style_string);
    }
    return processed_svg;
  }

  this.flattenDesign = (design) => {
    for (let type_name in design.types) {
      let svg_elements = design.types[type_name].elements.filter(e => e.type === 'svg');
      let swatches = design.types[type_name].swatches;
      for (let svg_element of svg_elements) {
        let flattened_svg = flattenSVG({ element: svg_element, swatches });
        svg_element.svg = {
          normal: <SvgCss width="100%" height="100%" xml={flattened_svg.normal}></SvgCss>,
          masked: <SvgCss width="100%" height="100%" xml={flattened_svg.masked}></SvgCss>

        }
      }
    }
    return design;
  }

  const preloadVideos = async (instructions) => {
    const base_url = RNFS.DocumentDirectoryPath + '/videos';
    let promises = [];
    let progresses = {};

    const updateProgress = () => {
      let total_progress = Object.values(progresses).reduce((a, b) => a + b, 0) / Object.values(progresses).length;
      console.info('total_progress ', total_progress);
      // setProgress(parseInt(total_progress));
      // setLoadingMessage(`loading videos: ${parseInt(total_progress)}% completed`);
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
          video.text = `${base_url}/${filename}`;
          resolve();
        });
      }))
    }

    return Promise.all(promises);
  }
}