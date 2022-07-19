const fs = require('fs')
const path = require('path')

onmessage = function(e) {
  const mapPath = path.join(e.data.path, e.data.map.name)

  postMessage({mapExists: fs.existsSync(mapPath), map: e.data.map});
}
