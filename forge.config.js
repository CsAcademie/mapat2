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
]
};