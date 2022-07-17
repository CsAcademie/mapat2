const fs = require('fs')
const path = require('path')
const downloadUrl = 'https://dl.csacademie.fr/maps/'
const request = require('request')

downloadFile = function (fileUrl, targetPath, progressCallback, endCallback) {
  let received_bytes = 0;
  let total_bytes = 0;

  let req = request({method: 'GET', uri: fileUrl});
  let out = fs.createWriteStream(targetPath)

  req.pipe(out)

  req.on('response', function (data) {
    // Change the total bytes value to get progress later.
    total_bytes = parseInt(data.headers['content-length'])
  });

  req.on('data', function(chunk) {
    received_bytes += chunk.length
    progressCallback((received_bytes * 100) / total_bytes)
  });

  req.on('end', function() {
    endCallback()
  });
}

onmessage = function(e) {
  console.log('Download: ' + e.data.map.name)
  const mapPath = path.join(e.data.path, e.data.map.name)

  downloadFile(
    downloadUrl + e.data.map.name,
    mapPath,
    (percent) => {postMessage({type: 'progress', percent, mapName: e.data.map.name});},
    () => {postMessage({type: 'downloaded'});}
  )
}
