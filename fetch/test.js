
const { exec } = require("child_process");
const ffmpeg = require('fluent-ffmpeg');

let src = './uploads/wheredowego2/knudqbc5';

ffmpeg.ffprobe(src + ".mp4", function (err, metadata) {
  if (err) {
    console.error(err);
  } else {
    // metadata should contain 'width', 'height' and 'display_aspect_ratio'
    let { width, height } = metadata.streams.find(v => v.codec_type === 'video')
    height = 2 * parseInt((200 * height / width) / 2);
    width = 200;
    exec(`ffmpeg -itsoffset -1 -i ${src}.mp4 -vcodec mjpeg -vframes 1 -an -f rawvideo -y -s ${width}x${height} ${src}.jpg`,
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
