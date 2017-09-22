#!/bin/sh
rm -rf dist
tsc
cp -a templates dist
cd public ; tsc ; cp *.css *.js *.json package.json index.html ../dist/public/ ; cd ..
cp package.json dist/