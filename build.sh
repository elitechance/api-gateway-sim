#!/bin/sh
rm -rf dist
./node_modules/.bin/tsc
cp -a templates LICENSE README.md CHANGELOG.md dist
cd public ; ./node_modules/.bin/tsc ; cp *.css *.js *.json package.json index.html ../dist/public/ ; cd ..
cp package.json dist/
