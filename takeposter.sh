#!/bin/bash
rm -f temp/poster.png
phantomjs --web-security=false ./takeposter.js $1 $2
