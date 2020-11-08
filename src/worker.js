let Worker = function () {};

Worker.prototype = {
    startButton: null,
    downloadPath: null,
    deleteButton: null,
    downloadCompressed: null,
    mapsToCheck: [],
    mapsToDownload: [],
    downloading: false,
    mapsToUnTar: [],
    unTaring: false,
    mapUrl: null,
    logs: [],
    apiUrl: 'https://portal.csacademie.fr/api/maps',
    mapDeleted: 0,

    init: function() {
        this.startButton = document.getElementById('startSync');
        this.stopButton = document.getElementById('stopSync');
        this.deleteButton = document.getElementById('deleteMaps');
        this.folderButton = document.getElementById('downloadPathButton');
        this.downloadCompressed = document.getElementById('downloadCompressed');
        this.startButton.addEventListener('click', window.appWorker.launchSync);
        this.stopButton.addEventListener('click', window.appWorker.stopSync);
        this.deleteButton.addEventListener('click', function () { window.appWorker.deleteMaps(1) });
        this.folderButton.addEventListener('click', window.appWorker.chooseMapFolder);

        document.getElementById('versionId').innerHTML = window.mapat.getVersion();

        window.appWorker.downloadPath = window.localStorage.getItem("downloadPath");
        window.appWorker.mapUrl = 'https://dl.csacademie.fr/maps';
        document.getElementById('downloadPath').innerHTML = window.appWorker.downloadPath;
        window.appWorker.checkMaps();
        window.appWorker.downloadMap();
        window.appWorker.unTarMap();
    },

    launchSync() {
        if (window.appWorker.downloadPath === undefined || window.appWorker.downloadPath === null
            || window.appWorker.downloadPath === '' || window.appWorker.downloadPath.length < 2) {
            window.appWorker.addLog('ERROR', 'Mauvaise destination pour télécharger les cartes');
            alert('Vous devez choisir un chemin valide pour télécharger les cartes.');
            return;
        }

        window.appWorker.addLog('INFO', 'Début de la vérification des cartes');
        window.appWorker.startButton.disabled = true;
        window.appWorker.stopButton.disabled = false;
        window.appWorker.getMapList(1);
    },

    stopSync() {
        window.appWorker.addLog('INFO', 'Arrêt de la vérification');
        window.appWorker.startButton.disabled = false;
        window.appWorker.stopButton.disabled = true;
        window.appWorker.mapsToCheck = [];
        window.appWorker.mapsToDownload = [];
        window.appWorker.mapsToUnTar = [];
    },

    chooseMapFolder() {
        let folder = window.mapat.openModalPathFile();

        window.localStorage.setItem("downloadPath", folder[0]);
        window.appWorker.downloadPath = folder[0];
        document.getElementById('downloadPath').innerHTML = folder[0];
        window.appWorker.addLog('INFO', 'Les cartes seront téléchargées dans : ' + folder[0])
    },

    getMapList(page) {
        let xHttp = new XMLHttpRequest();
        xHttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let response = JSON.parse(this.responseText);
                let mapList = response['hydra:member']

                for (let i in mapList) {
                    if (mapList.hasOwnProperty(i)) {
                        window.appWorker.mapsToCheck.push(mapList[i]);
                    }
                }

                if (response['hydra:view'] && response['hydra:view']['hydra:next']) {
                    window.appWorker.getMapList(page + 1)
                } else {
                    window.appWorker.addLog('INFO', 'Map list OK, check it');
                }
            }
        };
        xHttp.open(
          'GET',
          window.appWorker.apiUrl + '?page=' + page + '&itemsPerPage=50&isDeleted=false&_order[played]=ASC&_order[id]=DESC',
          true
        );
        xHttp.send();
    },

    deleteMaps(page) {
        window.appWorker.addLog("INFO", "Vérification des cartes à supprimer")
        let xHttp = new XMLHttpRequest();
        xHttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let response = JSON.parse(this.responseText);
                let mapList = response['hydra:member']

                for (let i in mapList) {
                    if (mapList.hasOwnProperty(i)) {
                        let map = mapList[i]
                        let filePath = window.appWorker.downloadPath + window.mapat.getSystemPathSeparator() + map.name;
                        if (window.mapat.isFileExist(filePath)) {
                            window.mapat.deleteFile(filePath)
                        }
                    }
                }

                if (response['hydra:view'] && response['hydra:view']['hydra:next']) {
                    window.appWorker.deleteMaps(page + 1)
                } else {
                    window.appWorker.addLog("INFO",window.appWorker.mapDeleted + " cartes supprimées")
                    window.appWorker.mapDeleted = 0
                }
            }
        };
        xHttp.open(
          'GET',
          window.appWorker.apiUrl + '?page=' + page + '&itemsPerPage=50&isDeleted=true',
          true
        );
        xHttp.send();
    },

    checkMaps() {
        if (window.appWorker.mapsToCheck.length === 0) {
            document.getElementById('check_current_map').innerHTML = '';

            setTimeout(window.appWorker.checkMaps, 1000);
            return;
        }

        let map = window.appWorker.mapsToCheck[0];
        let filePath = window.appWorker.downloadPath + window.mapat.getSystemPathSeparator() + map.name;
        window.appWorker.mapsToCheck.splice(0, 1);
        document.getElementById('check_max').innerHTML = window.appWorker.mapsToCheck.length.toString();
        document.getElementById('check_current_map').innerHTML = map.name;

        if (!window.mapat.isFileExist(filePath)) {
            window.appWorker.mapsToDownload.push(map);
        } else if (window.mapat.getFileMd5(filePath) !== map.md5) {
            window.mapat.deleteFile(filePath)
            window.appWorker.addLog('INFO', 'Mise à jour de la carte ' + map.name);
            window.appWorker.mapsToDownload.push(map);
        }
        document.getElementById('download_max').innerHTML = window.appWorker.mapsToDownload.length.toString();
        setTimeout(window.appWorker.checkMaps, 5);
    },

    downloadMap() {
        if (window.appWorker.downloading) {
            setTimeout(window.appWorker.downloadMap, 1000);
            return
        }

        if (window.appWorker.mapsToDownload.length === 0) {
            document.getElementById('download_current_map').innerHTML = '';
            document.getElementById('download_max').innerHTML = window.appWorker.mapsToDownload.length.toString();
            setTimeout(window.appWorker.downloadMap, 1000);
            return
        }

        let map = window.appWorker.mapsToDownload[0];
        let compressed = this.downloadCompressed.checked === true
        let filePath = window.appWorker.downloadPath + window.mapat.getSystemPathSeparator() + map.name
        let fileUrl = window.appWorker.mapUrl + '/' + map.name
        let type = ''

        if (compressed) {
            type = (map.size > 150000000) ? 'zip' : 'bz2'
            filePath += '.' + type
            fileUrl += '.' + type
        }

        window.appWorker.mapsToDownload.splice(0, 1);
        window.appWorker.downloading = true;
        document.getElementById('download_current_map').innerHTML = map.name;
        document.getElementById('download_max').innerHTML = window.appWorker.mapsToDownload.length.toString()

        if (window.mapat.isFileExist(filePath)) {
            window.mapat.deleteFile(filePath)
        }

        let progressCallback = (percent) => {
            document.getElementById('dl_progress_bar').style.width = percent + '%'
        }
        let endCallback = () => {
            window.appWorker.downloading = false
            document.getElementById('download_current_map').innerHTML = ''
            document.getElementById('dl_progress_bar').style.width = '0%'
            if (compressed) {
                window.appWorker.mapsToUnTar.push({filePath, type, name: map.name})
            }
        }
        window.mapat.downloadFile(fileUrl, filePath, progressCallback, endCallback)

        setTimeout(window.appWorker.downloadMap, 1000);
    },

    unTarMap() {
        if (window.appWorker.unTaring) {
            setTimeout(window.appWorker.unTarMap, 1000);
            return
        }

        if (window.appWorker.mapsToUnTar.length === 0) {
            document.getElementById('un_tar_current_map').innerHTML = '';
            document.getElementById('un_tar_max').innerHTML = window.appWorker.mapsToUnTar.length.toString();
            setTimeout(window.appWorker.unTarMap, 1000);
            return
        }

        let map = window.appWorker.mapsToUnTar[0];
        let outputPath = window.appWorker.downloadPath
        window.appWorker.mapsToUnTar.splice(0, 1);
        window.appWorker.unTaring = true;
        document.getElementById('un_tar_current_map').innerHTML = map.name;
        document.getElementById('un_tar_max').innerHTML = window.appWorker.mapsToUnTar.length.toString()

        let endCallback = () => {
            if (window.mapat.isFileExist(map.filePath)) {
                window.mapat.deleteFile(map.filePath)
            }
            window.appWorker.unTaring = false
            document.getElementById('un_tar_current_map').innerHTML = ''
        }

        window.mapat.unTarFile(map.type, map.filePath, map.name, outputPath, endCallback)
        setTimeout(window.appWorker.unTarMap, 1000);
    },

    addLog(type, message) {
        console.log(message);
        window.appWorker.logs.push('[' + type + ']: ' + message);
        document.getElementById('logs').innerHTML = window.appWorker.logs.join('<br />');
    }
};

window.appWorker = new Worker();
window.appWorker.init();
