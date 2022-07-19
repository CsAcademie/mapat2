const path = require('path')
const { contextBridge, ipcRenderer } = require('electron')
const fs = require("fs");

// worker variables
let mapList = []
let mapToCheckList = []
let maxMapToCheckList = 0
let mapToDownloadList = []
let mapToUnCompressList = []
let maxMapToUnCompressList = 0

// Worker process
let fileExistCheckerRunning = false
let checkMapMd5Running = false
let mapDownloaderRunning = false
let unCompressMapRunning = false

// Worker settings
let downloadFolderPath = null
let checkMapMd5 = false
let downloadMaps = false
let downloadCompressed = false

// Load workers
let mapFinderWorker = null
let fileExistCheckerWorker = null
let checkMapMd5Worker = null
let mapDownloaderWorker = null
let unCompressMapWorker = null

// Expose api
contextBridge.exposeInMainWorld('electronAPI', {
  initialisation: () => {
    const promise = ipcRenderer.invoke('get-version')

    promise.then((result) => {
      document.getElementById('mapat_version').innerHTML = result
    })

    downloadFolderPath = window.localStorage.getItem('downloadPath')
    refreshDownloadFolderPath()

    // Clean temp folder
    const tempFolder = path.join(downloadFolderPath, 'mapat-temp')

    if (fs.existsSync(tempFolder)) {
      fs.rmSync(tempFolder, { recursive: true, force: true })
    }
  },
  openMapDownloadFolder: () => {
    const promise = ipcRenderer.invoke('open-dialog-download-folder')
    promise.then((result) => {
      downloadFolderPath = result[0] ? result[0] : null
      window.localStorage.setItem('downloadPath', downloadFolderPath)
      refreshDownloadFolderPath()
    })
  },
  searchBetaUpdates: () => {
    ipcRenderer.invoke('search-beta-updates')
  },
  startSynchronization: () => startSynchronization(),
  stopSynchronization: () => stopSynchronization(),
  cleanOldMaps: () => cleanOldMaps()
})

// Functions
startSynchronization = function () {
  if (fileExistCheckerRunning || checkMapMd5Running || mapDownloaderRunning || unCompressMapRunning) {
    alert('Une action est déjà en cours. Veuillez attendre la fin des téléchargements ou décompressions en cours avant de relancer une synchronisation')
    return false;
  }

  const mapVerificationHTML = document.getElementById('map_verification')
  const mapDownloadingHTML = document.getElementById('map_downloading')
  const downloadCompressedHTML = document.getElementById('download_compressed')

  checkMapMd5 = mapVerificationHTML.checked
  downloadMaps = mapDownloadingHTML.checked
  downloadCompressed = downloadCompressedHTML.checked

  mapList = []
  mapToCheckList = []
  mapToDownloadList = []
  mapToUnCompressList = []
  maxMapToCheckList = 0
  maxMapToUnCompressList = 0
  fileExistCheckerRunning = false
  checkMapMd5Running = false
  mapDownloaderRunning = false
  unCompressMapRunning = false

  initMapFinderWorker()
  mapFinderWorker.postMessage(null)

  return true;
}

stopSynchronization = function () {
  checkMapMd5 = false
  downloadMaps = false

  mapList = []
  mapToCheckList = []
  mapToDownloadList = []
  mapToUnCompressList = []
}

cleanOldMaps = function () {
  const cleanOldMapsWorker = new Worker(path.join(__dirname, 'workers', 'cleanOldMaps.js'))

  cleanOldMapsWorker.postMessage({path: downloadFolderPath})

  // Get the number of deleted maps
  cleanOldMapsWorker.onmessage = function(e) {
    alert(e.data.mapsDeleted + ' cartes ont été supprimées')
    cleanOldMapsWorker.terminate()
  }
}

refreshDownloadFolderPath = function () {
  const downloadFolderPathHTML = document.getElementById('download_folder_path')

  if (downloadFolderPath === null) {
    downloadFolderPathHTML.innerHTML = 'Non défini'
  } else {
    downloadFolderPathHTML.innerHTML = downloadFolderPath
  }
}

// Launch functions
runFileExistCheckerWorker = function (newProcess) {
  if (fileExistCheckerRunning && newProcess) {
    return
  }

  if (mapList.length === 0) {
    fileExistCheckerRunning = false

    return
  }

  fileExistCheckerRunning = true
  initFileExistCheckerWorker()
  fileExistCheckerWorker.postMessage({map: (mapList.splice(0, 1))[0], path: downloadFolderPath})
}

runCheckMapMd5Worker = function (newProcess) {
  const countMapToCheckContainerHTML = document.getElementById('countMapToCheckContainer')
  const countMapToCheckHTML = document.getElementById('countMapToCheck')
  const percent = (maxMapToCheckList > 0) ? ((maxMapToCheckList - mapToCheckList.length) / maxMapToCheckList) * 100 : 0

  countMapToCheckHTML.innerHTML = mapToCheckList.length.toString()
  countMapToCheckContainerHTML.style.backgroundImage = 'conic-gradient(#003186 '+percent+'%, #2196F3 0)';

  if (checkMapMd5Running && newProcess) {
    return
  }

  if (!checkMapMd5 || mapToCheckList.length === 0) {
    checkMapMd5Running = false

    return
  }

  const checkingMapHTML = document.getElementById('checkingMap')
  const map = (mapToCheckList.splice(0, 1))[0]

  checkingMapHTML.innerHTML = map.name
  checkMapMd5Running = true

  initCheckMapMd5Worker()
  checkMapMd5Worker.postMessage({map: map, path: downloadFolderPath})
}

runMapDownloaderWorker = function (newProcess) {
  if (mapDownloaderRunning && newProcess) {
    return
  }

  if (!downloadMaps || mapToDownloadList.length === 0) {
    mapDownloaderRunning = false

    return
  }

  mapDownloaderRunning = true
  initMapDownloaderWorker()
  mapDownloaderWorker.postMessage(
    {
      map: (mapToDownloadList.splice(0, 1))[0],
      path: downloadFolderPath,
      compressed: downloadCompressed
    }
  )
}

runUnCompressMapWorker = function (newProcess) {
  const countMapToUnCompressHTML = document.getElementById('countMapToUnCompress')
  const countMapToUnCompressContainerHTML = document.getElementById('countMapToUnCompressContainer')
  const percent = (maxMapToUnCompressList > 0) ? ((maxMapToUnCompressList - mapToUnCompressList.length) / maxMapToUnCompressList) * 100 : 0

  countMapToUnCompressHTML.innerHTML = mapToUnCompressList.length.toString()
  countMapToUnCompressContainerHTML.style.backgroundImage = 'conic-gradient(#003186 '+percent+'%, #2196F3 0)';

  if (unCompressMapRunning && newProcess) {
    return
  }

  if (!downloadCompressed || mapToUnCompressList.length === 0) {
    unCompressMapRunning = false

    return
  }

  const item = (mapToUnCompressList.splice(0, 1))[0]
  const unCompressingMapHTML = document.getElementById('unCompressingMap')
  const map = item.map

  unCompressingMapHTML.innerHTML = map.name
  unCompressMapRunning = true

  initUnCompressMapWorker()

  unCompressMapWorker.postMessage(
    {
      map: map,
      unCompressType: item.unCompressType,
      path: downloadFolderPath
    }
  )
}

initMapFinderWorker = function () {
  if (mapFinderWorker === null) {
    mapFinderWorker = new Worker(path.join(__dirname, 'workers', 'mapFinder.js'))

    // Get map list and check if maps exists
    mapFinderWorker.onmessage = function(e) {
      if (e.data.type === 'map') {
        mapList.push(e.data.map)
        runFileExistCheckerWorker(true)
      }
    }
  }
}

initFileExistCheckerWorker = function () {
  if (fileExistCheckerWorker === null) {
    fileExistCheckerWorker = new Worker(path.join(__dirname, 'workers', 'fileExistChecker.js'))

    // Get result if map exists
    fileExistCheckerWorker.onmessage = function(e) {
      if (!e.data.mapExists) {
        mapToDownloadList.push(e.data.map)
        runMapDownloaderWorker(true)
      } else if (checkMapMd5) {
        mapToCheckList.push(e.data.map)

        if (mapToCheckList.length > maxMapToCheckList) {
          maxMapToCheckList = mapToCheckList.length
        }

        runCheckMapMd5Worker(true)
      }

      runFileExistCheckerWorker(false)
    }
  }
}

initCheckMapMd5Worker = function () {
  if (checkMapMd5Worker === null) {
    checkMapMd5Worker = new Worker(path.join(__dirname, 'workers', 'checkMapMd5.js'))

    // Return if local map MD5 match with portal map MD5
    checkMapMd5Worker.onmessage = function(e) {
      if (!e.data.md5Match) {
        mapToDownloadList.push(e.data.map)
        runMapDownloaderWorker(true)
      }

      document.getElementById('checkingMap').innerHTML = ''
      runCheckMapMd5Worker(false)
    }
  }
}

initMapDownloaderWorker = function () {
  if (mapDownloaderWorker === null) {
    mapDownloaderWorker = new Worker(path.join(__dirname, 'workers', 'mapDownloader.js'))

    // Get downloading map progress and message when map download is finished
    mapDownloaderWorker.onmessage = function(e) {
      if (e.data.type === 'downloaded') {
        document.getElementById('downloadingMap').innerHTML = ''
        runMapDownloaderWorker(false)

        if (e.data.compressed) {
          mapToUnCompressList.push({map: e.data.map, unCompressType: e.data.unCompressType})

          if (mapToUnCompressList.length > maxMapToUnCompressList) {
            maxMapToUnCompressList = mapToUnCompressList.length
          }

          runUnCompressMapWorker(true)
        }
      }

      if (e.data.type === 'progress') {
        const countMapToDownloadHTML = document.getElementById('countMapToDownload')
        const countMapToDownloadContainerHTML = document.getElementById('countMapToDownloadContainer')
        const downloadingMapHTML = document.getElementById('downloadingMap')

        countMapToDownloadHTML.innerHTML = mapToDownloadList.length.toString()
        countMapToDownloadContainerHTML.style.backgroundImage = 'conic-gradient(#003186 '+e.data.percent+'%, #2196F3 0)';
        downloadingMapHTML.innerHTML = e.data.mapName
      }
    }
  }
}

initUnCompressMapWorker = function () {
  if (unCompressMapWorker === null) {
    unCompressMapWorker = new Worker(path.join(__dirname, 'workers', 'unCompressMap.js'))

    // Get downloading map progress and message when map download is finished
    unCompressMapWorker.onmessage = function(e) {
      document.getElementById('unCompressingMap').innerHTML = ''
      runUnCompressMapWorker(false)
    }
  }
}
