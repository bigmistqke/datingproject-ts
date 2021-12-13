// import fetchProgress from 'fetch-progress'
import Uploader from '../helpers/Uploader'
import Emitter from "../helpers/Emitter"
import { useStore } from './Store';
import urls from '../urls';

export default function VideoUploader() {
  Emitter.call(this);
  const [state] = useStore();

  // const dispatch = (type, detail) => this.dispatchEvent(new CustomEvent(type, { detail: detail }));

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

  this.process = async (file, instruction_id) => {
    return new Promise((resolve) => {
      const uploader = new Uploader();
      // addUploader(instruction_id, uploader, resolve);
      setState


      uploader.process(`${urls.fetch}/api/uploadVideo/${state.script_id}/mp4`,
        { file, instruction_id });
      uploader.addEventListener('progress', (e) => {
        update({ instruction_id, type: 'progress' });
      });
      uploader.addEventListener('complete', () => {
        update({ instruction_id, type: 'complete' });
        resolve({ success: true, url: uploader.response });
      });
    })
  }
}