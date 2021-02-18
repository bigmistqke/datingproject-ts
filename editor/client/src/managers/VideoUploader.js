// import fetchProgress from 'fetch-progress'
import Uploader from '../helpers/Uploader'
import Emitter from "../helpers/Emitter"
export default function VideoUploader({ script_id }) {
    Emitter.call(this);

    const dispatch = (type, detail) => this.dispatchEvent(new CustomEvent(type, { detail: detail }));

    let uploaders = {};

    const addUploader = (instruction_id, uploader) =>
        uploaders[instruction_id] = uploader;
    const deleteUploader = (instruction_id) =>
        delete uploaders[instruction_id];

    const update = ({ instruction_id, type }) => {
        if (type === 'complete') {
            dispatch('update', uploaders)
            setTimeout(() => {
                deleteUploader(instruction_id);
                dispatch('update', uploaders)
            }, 2000)
        }
        if (type === 'progress') {
            setTimeout(() => {
                dispatch('update', uploaders)
            }, 10)
        }
    }

    this.process = async (file, instruction_id) => {
        return new Promise((resolve) => {
            const uploader = new Uploader();
            addUploader(instruction_id, uploader);
            uploader.process(`${window._url.fetch}/api/uploadVideo/${script_id}`,
                { file, instruction_id });
            uploader.addEventListener('progress', () => {
                update({ instruction_id, type: 'progress' });
            });
            uploader.addEventListener('complete', () => {
                update({ instruction_id, type: 'complete' });
                resolve({ success: true, url: uploader.response });
            });
        })
    }
}