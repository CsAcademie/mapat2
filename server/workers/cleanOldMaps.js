const fs = require('fs')
const path = require("path");
const apiURL = 'https://portal.csacademie.fr/api/maps'
const sortMap = '?itemsPerPage=50&isDeleted=true&isOfficial=false'
let deletedMaps = 0

getMapsAndDeleteIt = function (mapsPath, page) {
  let xHttp = new XMLHttpRequest()

  xHttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      let response = JSON.parse(this.responseText)
      let mapList = response['hydra:member']

      for (let i in mapList) {
        if (mapList.hasOwnProperty(i)) {
          const mapPath = path.join(mapsPath, mapList[i].name)

          if (fs.existsSync(mapPath)) {
            deletedMaps++
            fs.unlinkSync(mapPath)
          }
        }
      }

      if (response['hydra:view'] && response['hydra:view']['hydra:next']) {
        getMapsAndDeleteIt(mapsPath, page + 1)
      } else {
        postMessage({mapsDeleted: deletedMaps})
      }
    }
  }

  xHttp.open('GET', apiURL + sortMap + '&page=' + page, true)
  xHttp.send()
}

onmessage = function(e) {
  deletedMaps = 0
  getMapsAndDeleteIt(e.data.path, 1)
}
