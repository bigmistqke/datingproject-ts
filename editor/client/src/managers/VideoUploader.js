import fetchProgress from 'fetch-progress'

export default function VideoUploader({ script_id }) {
    this.process = async (file, instruction_id) => {
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('instruction_id', instruction_id);
            formData.append('script_id', script_id);

            fetch(`${window._url.fetch}/api/uploadVideo`, {
                method: 'POST',
                body: formData,
                processData: false,

                contentType: false
            }).then(response => response.json())
                .then(
                    fetchProgress({
                        onProgress(progress) {
                            console.log({ progress });
                        },
                    })
                )
                .then(url => {
                    resolve({ success: true, url: url });
                })
                .catch(error => {
                    resolve({ success: false, error: error });

                })
        })
    }
}