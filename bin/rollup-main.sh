#!/usr/bin/env bash

./node_modules/.bin/rollup -c &&\
./node_modules/.bin/uglifyjs always.js -o always.min.js --mangle --compress --source-map always.min.js.map