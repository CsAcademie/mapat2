const path = require('path')
const { contextBridge, ipcRenderer } = require('electron')

// worker variables
let mapList = []
let mapToCheckList = []
let maxMapToCheckList = 0
let mapToDownloadList = []

// Worker process
let fileExistCheckerRunning = false
let checkMapMd5Running = false
let mapDownloaderRunning = false

// Worker settings
let downloadFolderPath = null
let checkMapMd5 = false
let downloadMaps = false

// Load workers
const mapFinderWorker = new Worker(path.join(__dirname, 'workers', 'mapFinder.js'))
const fileExistCheckerWorker = new Worker(path.join(__dirname, 'workers', 'fileExistChecker.js'))
const checkMapMd5Worker = new Worker(path.join(__dirname, 'workers', 'checkMapMd5.js'))
const mapDownloaderWorker = new Worker(path.join(__dirname, 'workers', 'mapDownloader.js'))

// Expose api
contextBridge.exposeInMainWorld('electronAPI', {
  initialisation: () => {
    downloadFolderPath = window.localStorage.getItem('downloadPath')
    refreshDownloadFolderPath()
  },
  openMapDownloadFolder: () => {
    const promise = ipcRenderer.invoke('open-dialog-download-folder')
    promise.then((result) => {
      downloadFolderPath = result[0] ? result[0] : null
      window.localStorage.setItem('downloadPath', downloadFolderPath)
      refreshDownloadFolderPath()
    })
  },
  startSynchronization: () => startSynchronization(),
  stopSynchronization: () => stopSynchronization()
})

// Functions
startSynchronization = function () {
  console.log('Start')
  const mapVerificationHTML = document.getElementById('map_verification')
  const mapDownloadingHTML = document.getElementById('map_downloading')

  checkMapMd5 = mapVerificationHTML.checked
  downloadMaps = mapDownloadingHTML.checked

  mapList = []
  mapToCheckList = []
  mapToDownloadList = []
  maxMapToCheckList = 0
  fileExistCheckerRunning = false
  checkMapMd5Running = false
  mapDownloaderRunning = false
  mapFinderWorker.postMessage(null)
}

stopSynchronization = function () {
  checkMapMd5 = false
  downloadMaps = false

  mapList = []
  mapToCheckList = []
  mapToDownloadList = []
  maxMapToCheckList = 0
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
  fileExistCheckerWorker.postMessage({map: (mapList.splice(0, 1))[0], path: downloadFolderPath})
}

runCheckMapMd5Worker = function (newProcess) {
  if (!checkMapMd5 || (checkMapMd5Running && newProcess)) {
    return
  }

  if (mapToCheckList.length === 0) {
    checkMapMd5Running = false

    return
  }

  const checkingMapHTML = document.getElementById('checkingMap')
  const map = (mapToCheckList.splice(0, 1))[0]

  checkingMapHTML.innerHTML = map.name
  checkMapMd5Running = true
  checkMapMd5Worker.postMessage({map: map, path: downloadFolderPath})
}

runMapDownloaderWorker = function (newProcess) {
  if (!downloadMaps || (mapDownloaderRunning && newProcess)) {
    return
  }

  if (mapToDownloadList.length === 0) {
    mapDownloaderRunning = false

    return
  }

  mapDownloaderRunning = true
  mapDownloaderWorker.postMessage({map: (mapToDownloadList.splice(0, 1))[0], path: downloadFolderPath})
}

// Get map list and check if maps exists
mapFinderWorker.onmessage = function(e) {
  if (e.data.type === 'map') {
    mapList.push(e.data.map)
    runFileExistCheckerWorker(true)
  }
}

// Get result if map exists
fileExistCheckerWorker.onmessage = function(e) {
  if (e.data.mapExists) {
    mapToCheckList.push(e.data.map)

    if (mapToCheckList.length > maxMapToCheckList) {
      maxMapToCheckList =mapToCheckList.length
    }

    runCheckMapMd5Worker(true)
  } else {
    mapToDownloadList.push(e.data.map)
    runMapDownloaderWorker(true)
  }

  runFileExistCheckerWorker(false)
}

// Get is map md5 match
checkMapMd5Worker.onmessage = function(e) {
  if (!e.data.md5Match) {
    mapToDownloadList.push(e.data.map)
    runMapDownloaderWorker(true)
  }

  runCheckMapMd5Worker(false)

  const countMapToCheckHTML = document.getElementById('countMapToCheck')
  const countMapToCheckContainerHTML = document.getElementById('countMapToCheckContainer')
  const percent = (maxMapToCheckList / mapToCheckList.length) * 100

  countMapToCheckHTML.innerHTML = mapToCheckList.length.toString()
  countMapToCheckContainerHTML.style.backgroundImage = 'conic-gradient(#003186 '+percent+'%, #2196F3 0)';
}

// Get is map md5 match
mapDownloaderWorker.onmessage = function(e) {
  if (e.data.type === 'downloaded') {
    runMapDownloaderWorker(false)
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
