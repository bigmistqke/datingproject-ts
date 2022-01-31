
const { exec } = require("child_process");
const ffmpeg = require('fluent-ffmpeg');
const glob = require("glob");
const fs = require('fs')

glob("./uploads/*", {}, (er, projects) => {
  projects.forEach(project => {
    console.log(project);

    glob(`${project}/*.mp4`, {}, (er, files) => {
      files.forEach(file => {
        file = file.replace(".mp4", "");
        if (fs.existsSync(file + ".jpg")) return;
        ffmpeg.ffprobe(file + ".mp4", function (err, metadata) {
          if (err) {
            console.error(err);
          } else {
            let { width, height } = metadata.streams.find(v => v.codec_type === 'video')
            height = 2 * parseInt((200 * height / width) / 2);
            width = 200;
            console.log(width, height);
            exec(`ffmpeg -itsoffset -1 -i ${file}.mp4 -vcodec mjpeg -vframes 1 -an -f rawvideo -y -s ${width}x${height} ${file}.jpg`,
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
      })
    })
  })

})

