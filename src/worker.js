let Worker = function () {
    return;
};

Worker.prototype = {
    startButton: null,
    downloadPath: null,
    mapsToCheck: [],
    mapsToDownload: [],
    mapsToUntar: [],
    downloading: false,
    mapUrl: null,
    logs: [],

    init: function() {
        this.startButton = document.getElementById('startSync');
        this.stopButton = document.getElementById('stopSync');
        this.folderButton = document.getElementById('downloadPathButton');
        this.startButton.addEventListener('click', window.appWorker.launchSync);
        this.stopButton.addEventListener('click', window.appWorker.stopSync);
        this.folderButton.addEventListener('click', window.appWorker.openModalPathFile);

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
        window.appWorker.getMapList(1);
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
        const { dialog } = require('electron').remote
        let options = {properties:["openDirectory"]}
        let dir = dialog.showOpenDialogSync(options)
        window.localStorage.setItem("downloadPath", dir[0]);
        window.appWorker.downloadPath = dir[0];
        document.getElementById('downloadPath').innerHTML = dir[0];
    },

    getMapList(page) {
        const apiUrl = 'https://portal.csacademie.fr/api/maps';
        page=1&itemsPerPage=20&_order[name]=ASC&isDeleted=false&rate[gte]=0&rate[lte]=100

        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
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
                    window.appWorker.addLog("Map list OK, check it");
                }
            }
        };
        xhttp.open('GET', apiUrl + '?page=' + page + '&itemsPerPage=50&isDeleted=false&_order[id]=DESC', true);
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
            // if (map.size > 150000000) {
            //     // bz2
            // } else {
            //     // zip
            // }
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
        window.appWorker.logs.push(message);
        document.getElementById('logs').innerHTML = window.appWorker.logs.join('<br />');
    }
};
window.appWorker = new Worker();
window.appWorker.init();
