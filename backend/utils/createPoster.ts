import { exec } from 'child_process'
import ffmpeg from 'fluent-ffmpeg'

export default function createPoster(path: string) {
  // remove extension from path
  const extension = path.split('.').slice(-1)[0]
  const path_without_extension = path.split('.').slice(0, -1).join('.')
  ffmpeg.ffprobe(path_without_extension + '.mp4', function (err, metadata) {
    if (err) {
      console.error(err)
    } else {
      const video = metadata.streams.find(v => v.codec_type === 'video')

      if (!video) return
      if (video.height === undefined || video.width === undefined) return

      const height = 2 * Math.floor((500 * video.height) / video.width / 2)
      const width = 500

      exec(
        `ffmpeg -itsoffset -1 -i ${path_without_extension}.${extension} -vcodec mjpeg -vframes 1 -an -f rawvideo -y -s ${width}x${height} ${path_without_extension}.jpg`,
        (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`)
            return
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`)
            return
          }
          console.log(`stdout: ${stdout}`)
        },
      )
    }
  })
}
