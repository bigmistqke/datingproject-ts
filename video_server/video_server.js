const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const resolve = path.resolve

const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')

const archiver = require('archiver');

const redis = require("redis");
const jsonify = require('redis-jsonify')
const flat = require('flat');
var unflatten = require('flat').unflatten;
const promisify = require('util').promisify;

// init express
var app = express();
app.use(cors())
app.listen(8088);
app.use('/api/uploads', express.static('uploads'))

//init redis
_redis = redis.createClient();
j_redis = jsonify(_redis);

_redis.on("error", function (error) {
    console.error(error);
});

const _get = promisify(j_redis.get).bind(_redis);
const _set = promisify(j_redis.set).bind(_redis);
const _hmset = promisify(_redis.hmset).bind(_redis);
const _hget = promisify(_redis.hget).bind(_redis);
const _hdel = promisify(_redis.hdel).bind(_redis);
const _del = promisify(_redis.del).bind(_redis);


const video_queue = [];

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

app.use(bodyParser.json())
app.get('/convert/hls/:file_name', async function (req, res, next) {
    let file_name = req.params.file_name;
    video_queue.push(file_name);

    if (video_queue.length == 0) {
        executeQueue()
    }
})


const executeQueue = () => {
    const file_name = video_queue[0];
    const video_url = `localhost:8080/uploads/${file_name}`;
    const name = path.basename(file_name, path.extname(file_name));
    // const video_dl = 
    const myShellScript = exec(`sh video_to_hsl.sh ${video_url} hls/name`);
    myShellScript.stdout.on('data', (data) => {
        console.log(video_url);

        zip(video_url);
        // do whatever you want here with data
        video_queue.shift()
        if (video_queue.length != 0) executeQueue()

    });
    myShellScript.stderr.on('data', (data) => {
        console.error(data);
    });
}


const zip = (file_name) => {
    return new Promise((resolve, error) => {
        // create a file to stream archive data to.
        const output = fs.createWriteStream(__dirname + `/hls/${file_name}.zip`);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve();
        });

        output.on('end', function () {
            console.log('Data has been drained');

        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });

        // good practice to catch this error explicitly
        archive.on('error', function (err) {
            error();
            throw err;
        });
        archive.pipe(output);
        archive.directory(`hls/${file_name}`, false);
        archive.finalize();
    })

}
