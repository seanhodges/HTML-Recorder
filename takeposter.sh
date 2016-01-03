#!/bin/bash
rm -f temp/poster.png
phantomjs ./takeposter.js $1
