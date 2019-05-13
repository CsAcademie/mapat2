let Worker = function () {
    return;
};

Worker.prototype = {
    startButton: null,
    downloadPath: null,
    mapListAjax: null,
    mapsToCheck: [],
    mapsToDownload: [],
    mapsToUntar: [],
    downloading: false,
    mapUrl: null,

    init: function() {
        this.startButton = document.getElementById('startSync');
        this.stopButton = document.getElementById('stopSync');
        this.folderButton = document.getElementById('downloadPathButton');
        this.folderInput = document.getElementById('downloadPathInput');
        this.startButton.addEventListener('click', window.appWorker.launchSync);
        this.stopButton.addEventListener('click', window.appWorker.stopSync);
        this.folderButton.addEventListener('click', window.appWorker.openModalPathFile);
        this.folderInput.addEventListener('change', window.appWorker.changeDownloadPath);

        let versionId = window.require('electron').remote.app.getVersion();
        document.getElementById('versionId').innerHTML = versionId;

        window.appWorker.downloadPath = window.localStorage.getItem("downloadPath");
        window.appWorker.mapUrl = 'https://dl.csacademie.fr/maps';
        document.getElementById('downloadPath').innerHTML = window.appWorker.downloadPath;
        window.appWorker.checkMaps();
        window.appWorker.downloadMap();
    },

    launchSync() {
        if (window.appWorker.downloadPath === undefined || window.appWorker.downloadPath === null
            || window.appWorker.downloadPath === '' || window.appWorker.downloadPath.length < 2) {
            alert('Vous devez choisir un chemin valide pour télécharger les cartes.');
            return;
        }
        window.appWorker.addLog("Start synchronization");
        window.appWorker.startButton.disabled = true;
        window.appWorker.stopButton.disabled = false;
        window.appWorker.getMapList();
    },

    stopSync() {
        window.appWorker.addLog("Stop synchronization");
        window.appWorker.startButton.disabled = false;
        window.appWorker.stopButton.disabled = true;
        window.appWorker.mapsToCheck = [];
        window.appWorker.mapsToDownload = [];
        window.appWorker.mapsToUntar = [];
    },

    openModalPathFile() {
        document.getElementById('downloadPathInput').click();
    },

    changeDownloadPath() {
        let path = document.getElementById('downloadPathInput').files[0].path;
        window.localStorage.setItem("downloadPath", path);
        window.appWorker.downloadPath = path;
        document.getElementById('downloadPath').innerHTML = path;
    },

    getMapList() {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                window.appWorker.mapListAjax = JSON.parse(this.responseText);
                for (let i in window.appWorker.mapListAjax.maps) {
                    if (window.appWorker.mapListAjax.maps.hasOwnProperty(i)) {
                        let map = window.appWorker.mapListAjax.maps[i];
                        window.appWorker.mapsToCheck.push(map);
                    }
                }
                window.appWorker.addLog("Map list OK, check it");
            }
        };
        xhttp.open("GET", "https://portal.csacademie.fr/ajax/maps/list", true);
        xhttp.send();
    },

    checkMaps() {
        const fs = require('fs');
        const md5File = require('md5-file');

        if (window.appWorker.mapsToCheck.length > 0) {
            let map = window.appWorker.mapsToCheck[0];

            document.getElementById('check_max').innerHTML = (window.appWorker.mapsToCheck.length - 1).toString();
            document.getElementById('check_current_map').innerHTML = map.name;

            window.appWorker.mapsToCheck.splice(0, 1);
            let filePath = window.appWorker.downloadPath + '\\' + map.name; // @TODO LINUX/MAC
            if (fs.existsSync(filePath)) {
                const hash = md5File.sync(filePath);
                if (hash !== map.md5) {
                    fs.unlinkSync(filePath);
                    window.appWorker.addLog("Hash error: " + map.name);
                    window.appWorker.mapsToDownload.push(map);
                }
            } else {
                window.appWorker.mapsToDownload.push(map);
                document.getElementById('download_max').innerHTML = (window.appWorker.mapsToDownload.length - 1).toString();
            }
            setTimeout(window.appWorker.checkMaps, 5);
        } else {
            setTimeout(window.appWorker.checkMaps, 1000);
        }
    },

    downloadMap() {
        if (!window.appWorker.downloading && window.appWorker.mapsToDownload.length > 0) {
            let map = window.appWorker.mapsToDownload[0];
            window.appWorker.downloading = true;

            document.getElementById('download_current_map').innerHTML = map.name;
            document.getElementById('download_max').innerHTML = (window.appWorker.mapsToDownload.length - 1).toString();

            window.appWorker.mapsToDownload.splice(0, 1);
            let filePath = window.appWorker.downloadPath + '\\' + map.name; // @TODO LINUX/MAC
            let downloadUrl = window.appWorker.mapUrl + '/' + map.name;

            window.appWorker.downloadFile(downloadUrl, filePath);
        }
        setTimeout(window.appWorker.downloadMap, 1000);
    },

    downloadFile: function(file_url , targetPath) {
        const request = require('request');
        const fs = require('fs');

        let received_bytes = 0;
        let total_bytes = 0;

        let req = request({
            method: 'GET',
            uri: file_url
        });

        let out = fs.createWriteStream(targetPath);
        req.pipe(out);

        req.on('response', function ( data ) {
            // Change the total bytes value to get progress later.
            total_bytes = parseInt(data.headers['content-length' ]);
        });

        req.on('data', function(chunk) {
            received_bytes += chunk.length;
            window.appWorker.showProgress(received_bytes, total_bytes);
        });

        req.on('end', function() {
            window.appWorker.downloading = false;
            document.getElementById('download_current_map').innerHTML = '';
        });
    },

    showProgress: function(received,total) {
        let percentage = (received * 100) / total;
        document.getElementById('dl_progress_bar').style.width = percentage + '%'
    },

    addLog(message) {
        console.log(message);
    }

};
window.appWorker = new Worker();
window.appWorker.init();