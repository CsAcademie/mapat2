const md5File = require('md5-file')
const path = require('path')
const fs = require('fs')

onmessage = function(e) {
  const mapPath = path.join(e.data.path, e.data.map.name)
  const md5Match = e.data.map.md5 === md5File.sync(mapPath)

  if (!md5Match) {
    console.log('Bad map md5: ' + e.data.map.name)
    fs.unlinkSync(mapPath)
  }

  postMessage({md5Match: md5Match, map: e.data.map});
}
