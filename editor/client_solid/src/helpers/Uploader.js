export default function Uploader() {
  this.progress = undefined;

  this.process = (url, data) => new Promise((resolve) => {
    console.log('start the process!');

    const formData = new FormData();
    for (let key in data) {
      formData.append(key, data[key]);
    }

    var xhr = new XMLHttpRequest();

    xhr.onload = function (e) {
      console.log(e);
      if (this.readyState == 4 && this.status == 200) {
        let response;
        try {
          response = JSON.parse(xhr.responseText);
        } catch (e) {
          console.error('could not parse the response. setting response to unparsed responseText instead');
          response = xhr.responseText;
        }
        resolve({ success: true, response })
      }
    };

    xhr.onerror = function (e) {
      resolve({ success: false })
    }
    xhr.upload.onprogress = (e) => {
      this.progress = { loaded: e.loaded, total: e.total, percentage: e.loaded / e.total * 100 }
    };
    xhr.open("POST", url, true);
    console.log('send the data!');
    xhr.send(formData);
  })

}