module.exports = {
    make_targets: {
        win32: [
            'squirrel',
            'zip'
        ],
        darwin: [
            'zip'
        ],
        linux: [
            'deb',
            'rpm'
        ]
    },
    electronPackagerConfig: {
        icon: 'logo',
        appCopyright: 'Copyright (c) CsAcademie',
        win32metadata: {
            ProductName: 'mapat2',
            InternalName: 'mapat2',
            OriginalFilename: 'mapat2.exe',
            FileDescription: 'CSGO maps downloader',
            CompanyName: 'CsAcademie'
        },
        ignore: [
            /[\\\/](out|)[\\\/]/i,
            /\.idea/i,
            /forge\.config\.js$/i,
            /readme[^\\\/]*$/i,
        ]
    },
    electronWinstallerConfig: {
        name: 'mapat2'
    },
    electronInstallerDebian: {},
    electronInstallerRedhat: {},
    github_repository: {
        owner: 'CsAcademie',
        name: 'mapat2',
        draft: true,
        prerelease: true
    },
    windowsStoreConfig: {
        packageName: ''
    }
};