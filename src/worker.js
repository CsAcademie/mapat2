let Worker = function () {
    return;
};

Worker.prototype = {
    startButton: null,
    downloadPath: null,

    init: function() {
        this.startButton = document.getElementById('startSync');
        this.folderButton = document.getElementById('downloadPathButton');
        this.folderInput = document.getElementById('downloadPathInput');
        this.startButton.addEventListener('click', window.appWorker.launchSync);
        this.folderButton.addEventListener('click', window.appWorker.openModalPathFile);
        this.folderInput.addEventListener('change', window.appWorker.changeDownloadPath);

        window.appWorker.downloadPath = window.localStorage.getItem("downloadPath");
        document.getElementById('downloadPath').innerHTML = window.appWorker.downloadPath;
    },

    launchSync() {
        console.log('launch');
        window.appWorker.openModalPathFile();
    },

    openModalPathFile() {
        document.getElementById('downloadPathInput').click();
    },

    changeDownloadPath() {
        let path = document.getElementById('downloadPathInput').files[0].path;
        console.log(path);
        window.localStorage.setItem("downloadPath", path);
        window.appWorker.downloadPath = path;
        document.getElementById('downloadPath').innerHTML = path;
    }

};
window.appWorker = new Worker();
window.appWorker.init();