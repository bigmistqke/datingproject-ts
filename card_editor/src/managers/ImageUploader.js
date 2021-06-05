// import fetchProgress from 'fetch-progress'
import Uploader from '../helpers/Uploader'
import Emitter from "../helpers/Emitter"
export default function ImageUploader({ card_id }) {
    Emitter.call(this);

    const dispatch = (type, detail) => this.dispatchEvent(new CustomEvent(type, { detail: detail }));

    let uploaders = [];
    let queue = [];


    const addUploader = (instruction_id, uploader, resolve) => {
        uploaders.push({ instruction_id, uploader, resolve });
    }

    const deleteUploader = (instruction_id) => {
        uploaders = uploaders.filter(v => v.instruction_id != instruction_id);
    }

    const update = ({ instruction_id, type }) => {
        if (type === 'complete') {
            dispatch('update', uploaders)
            deleteUploader(instruction_id);
            setTimeout(() => {
                dispatch('update', uploaders)
            }, 1000)
        }
        if (type === 'progress') {
            setTimeout(() => {
                dispatch('update', uploaders)
            }, 10)
        }
    }

    this.isUploading = () => uploaders.length !== 0

    this.process = async ({ file, element_id }) => {
        return new Promise((resolve) => {
            const uploader = new Uploader();
            addUploader(element_id, uploader, resolve);
            console.log('ole!');
            uploader.process(`${window._url.fetch}/api/card/uploadImage/${card_id}/${element_id}`,
                { file });
            uploader.addEventListener('progress', (e) => {
                update({ element_id, type: 'progress' });
            });
            uploader.addEventListener('complete', () => {
                update({ element_id, type: 'complete' });
                resolve({ success: true, url: uploader.response });
            });
        })
    }
}
