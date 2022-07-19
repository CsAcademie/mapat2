const apiURL = 'https://portal.csacademie.fr/api/maps'
const sortMap = '?itemsPerPage=100&isDeleted=false&_order[played]=ASC&_order[id]=DESC'

getMaps = function (page) {
  let xHttp = new XMLHttpRequest()

  xHttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      let response = JSON.parse(this.responseText)
      let mapList = response['hydra:member']

      for (let i in mapList) {
        if (mapList.hasOwnProperty(i)) {
          postMessage({type: 'map', map: mapList[i]});
        }
      }

      if (response['hydra:view'] && response['hydra:view']['hydra:next']) {
        getMaps(page + 1)
      }
    }
  }

  xHttp.open('GET', apiURL + sortMap + '&page=' + page, true)
  xHttp.send()
}

onmessage = function(e) {
  getMaps(1)
}
