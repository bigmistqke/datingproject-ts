import Emitter from "./Emitter"

export default function Uploader() {
    Emitter.call(this);
    this.response = '';
    this.progress = {};

    const setResponse = v => this.response = v
    const setProgress = v => this.progress = v
    const setStatus = v => this.status = v

    this.process = (url, data) => {
        const formData = new FormData();
        for (let key in data) {
            formData.append(key, data[key]);
        }

        const dispatch = (type, detail) => this.dispatchEvent(new CustomEvent(type, { detail: detail }));

        var xhr = new XMLHttpRequest();
        // ////console.log('start', performance.now());
        xhr.onload = function (e) {
            if (this.readyState == 4 && this.status == 200) {
                ////console.log(xhr.responseText);
                try {
                    setResponse(JSON.parse(xhr.responseText));
                } catch (e) {
                    console.error('could not parse the response. setting response to unparsed responseText instead');
                    setResponse(xhr.responseText);
                }
                setStatus('completed');
                dispatch('complete');

            }
        };
        xhr.upload.onprogress = function (e) {
            /* ////console.log('first progress', performance.now());

            ////console.log(e); */
            setProgress({ loaded: e.loaded, total: e.total, percentage: e.loaded / e.total * 100 });
            setStatus('uploading');
            dispatch('progress');
        };
        xhr.open("POST", url, true);
        xhr.send(formData);
    }
}