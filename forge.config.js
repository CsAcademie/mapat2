module.exports = {
    "makers": [
        {
            "name": "@electron-forge/maker-zip"
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    maintainer: 'Azzod',
                    homepage: 'https://csacademie.fr'
                }
            }
        },
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                certificateFile: './MySPC.pfx'
            }
        }
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'CsAcademie',
                    name: 'mapat2'
                },
                prerelease: true
            }
        }
    ]
};