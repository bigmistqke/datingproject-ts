const { exec } = require("child_process");
const ffmpeg = require('fluent-ffmpeg');
function createPoster(path) {
  // remove extension from 
  const extension = path.split(".").slice(-1)[0];
  const path_without_extension = path.split(".").slice(0, -1).join(".");
  ffmpeg.ffprobe(path_without_extension + ".mp4", function (err, metadata) {
    if (err) {
      console.error(err);
    } else {
      let { width, height } = metadata.streams.find(v => v.codec_type === 'video')
      height = 2 * parseInt((500 * height / width) / 2);
      width = 500;
      exec(`ffmpeg -itsoffset -1 -i ${path_without_extension}.${extension} -vcodec mjpeg -vframes 1 -an -f rawvideo -y -s ${width}x${height} ${path_without_extension}.jpg`,
        (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        });
    }
  });
}
module.exports = createPoster