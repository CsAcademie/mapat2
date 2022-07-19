const startButtonHTML = document.getElementById('startButton')
const stopButtonHTML = document.getElementById('stopButton')
const cleanButtonHTML = document.getElementById('cleanButton')
const changeDownloadFolderButtonHTML = document.getElementById('changeDownloadFolderButton')
const betaUpdaterButtonHTML = document.getElementById('betaUpdaterButton')

startButtonHTML.addEventListener('click', () => {
  if (window.electronAPI.startSynchronization()) {
    startButtonHTML.disabled = true
    stopButtonHTML.disabled = false
  }
})

stopButtonHTML.addEventListener('click', () => {
  window.electronAPI.stopSynchronization()
  startButtonHTML.disabled = false
  stopButtonHTML.disabled = true
})

changeDownloadFolderButtonHTML.addEventListener('click', () => {
  window.electronAPI.openMapDownloadFolder()
})

cleanButtonHTML.addEventListener('click', () => {
  window.electronAPI.cleanOldMaps()
})

betaUpdaterButtonHTML.addEventListener('change', (ev) => {
  if (ev.target.checked) {
    localStorage.setItem('updateChannel', 'beta')
    window.electronAPI.searchBetaUpdates()
  } else {
    localStorage.removeItem('updateChannel')
  }
})

window.electronAPI.initialisation()

let updateChannel = localStorage.getItem('updateChannel')

if (updateChannel === 'beta') {
  betaUpdaterButtonHTML.checked = true
  window.electronAPI.searchBetaUpdates()
}
