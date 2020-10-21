const {
  contextBridge,
  remote
} = require("electron")
const fs = require('fs')
const md5File = require('md5-file')
const path = require('path')
const request = require('request')

contextBridge.exposeInMainWorld(
  "mapat", {
    getVersion: () => {
      console.log(remote.app.getVersion())
      return remote.app.getVersion()
    },

    openModalPathFile: () => {
      let options = {properties:["openDirectory"]}

      return remote.dialog.showOpenDialogSync(options)
    },

    isFileExist: (filePath) => {
      return fs.existsSync(filePath)
    },

    getFileMd5: (filePath) => {
      return md5File.sync(filePath)
    },

    deleteFile: (filePath) => {
      return fs.unlinkSync(filePath);
    },

    getSystemPathSeparator: () => {
      return path.sep
    },

    downloadFile: (fileUrl, targetPath, progressCallback, endCallback) => {
      let received_bytes = 0;
      let total_bytes = 0;

      let req = request({
        method: 'GET',
        uri: fileUrl
      });

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
  }
);
