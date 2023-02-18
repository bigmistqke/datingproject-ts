export default class Uploader {
  process = ({
    url,
    data,
    onProgress,
  }: {
    url: string
    data: any
    onProgress?: (progress: {
      loaded: number
      total: number
      percentage: number
    }) => void
  }) =>
    new Promise(resolve => {
      const formData = new FormData()
      for (let key in data) {
        formData.append(key, data[key])
      }

      var xhr = new XMLHttpRequest()

      xhr.onload = function (e) {
        if (this.readyState == 4 && this.status == 200) {
          let response
          try {
            response = JSON.parse(xhr.responseText)
          } catch (e) {
            console.error(
              'could not parse the response. setting response to unparsed responseText instead',
            )
            response = xhr.responseText
          }
          resolve({ success: true, response })
        }
      }

      xhr.onerror = function (e) {
        resolve({ success: false })
      }
      xhr.upload.onprogress = e => {
        console.log((e.loaded / e.total) * 100)
        if (onProgress)
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: (e.loaded / e.total) * 100,
          })
      }
      xhr.open('POST', url, true)
      xhr.send(formData)
    })
}
