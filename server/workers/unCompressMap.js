const DecompressZip = require('decompress-zip')
const decompress = require('decompress');
const decompressBzip2 = require('decompress-bzip2')
const path = require("path");
const fs = require("fs");

onmessage = function(e) {
  console.log('Uncompress map: ' + e.data.map.name)

  const compressedMapName = e.data.map.name + e.data.unCompressType
  const compressedFilePath = path.join(e.data.path, 'mapat-temp', compressedMapName)
  const outputPath = e.data.path
  const outputFilePath = path.join(e.data.path, e.data.map.name)

  const extractedCallback = function (ev) {
    if (fs.existsSync(compressedFilePath)) {
      fs.rmSync(compressedFilePath)
    }

    postMessage({});
  }

  if (e.data.unCompressType === '.zip') {
    let decompressZip = new DecompressZip(compressedFilePath)

    decompressZip.on('extract', extractedCallback)
    decompressZip.extract({path: outputPath});
  } else {
    decompress(
      compressedFilePath,
      outputPath,
      {plugins: [decompressBzip2({path: e.data.map.name})]}
    ).then(() => {
      fs.chmodSync(outputFilePath, '664');
      extractedCallback()
    })
  }
}
