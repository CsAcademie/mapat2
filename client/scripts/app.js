const startButtonHTML = document.getElementById('startButton')
const stopButtonHTML = document.getElementById('stopButton')
const changeDownloadFolderButton = document.getElementById('changeDownloadFolderButton')

startButtonHTML.addEventListener('click', () => {
  console.log('Click')
  window.electronAPI.startSynchronization()
  startButtonHTML.disabled = true
  stopButtonHTML.disabled = false
})

stopButtonHTML.addEventListener('click', () => {
  window.electronAPI.stopSynchronization()
  startButtonHTML.disabled = false
  stopButtonHTML.disabled = true
})

changeDownloadFolderButton.addEventListener('click', () => {
  window.electronAPI.openMapDownloadFolder()
})

window.electronAPI.initialisation()
