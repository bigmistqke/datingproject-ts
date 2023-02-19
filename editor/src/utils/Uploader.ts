type Progress = {
  loaded: number
  total: number
  percentage: number
}

type ProgressCallback = (progress: Progress) => void

export type UploaderResponse =
  | {
      success: true
      response: string
    }
  | {
      success: false
    }

export default class Uploader {
  progressEventHandlers: Set<ProgressCallback> = new Set()
  onProgress = (callback: ProgressCallback) =>
    this.progressEventHandlers.add(callback)
  dispatchProgressEvent = (progress: Progress) =>
    this.progressEventHandlers.forEach(callback => callback(progress))

  process = ({ url, data }: { url: string; data: any }) =>
    new Promise<UploaderResponse>(resolve => {
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
        const progress = {
          loaded: e.loaded,
          total: e.total,
          percentage: (e.loaded / e.total) * 100,
        }
        this.dispatchProgressEvent(progress)
      }
      xhr.open('POST', url, true)
      xhr.send(formData)
    })
}
