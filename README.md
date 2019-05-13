# Développement

- Récupération des packages : `npm install`
- Démarrer l'application : `npm start`

# Déploiement

- Vérifier que le certificat est bien présent (MySPC.pfx)
- Génération de l'installeur : `npm run pack` ou `npm run build`
- Publier (Linux) : `GH_TOKEN=xxx npm run releas`
- Publier (Window) : `$Env:GITHUB_TOKEN="xxx"` puis `npm run releas`


## Publication docker


```
docker run --rm -ti  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_')  --env ELECTRON_CACHE="/root/.cache/electron"  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder"  -v ${PWD}:/project  -v ${PWD##*/}-node-modules:/project/node_modules  -v ~/.cache/electron:/root/.cache/electron  -v ~/.cache/electron-builder:/root/.cache/electron-builder  electronuserland/builder:wine
```

`npm run dist-win`

`GH_TOKEN=xxxnpm run publish-win`