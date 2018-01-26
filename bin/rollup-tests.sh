#!/usr/bin/env bash

../node_modules/.bin/rollup -c &&\
../node_modules/.bin/uglifyjs tests.js -o tests.min.js --mangle --compress --source-map tests.min.js.map