#!/bin/bash
phantomjs ./phantomrecorder.js $1 $2 $3
rm -f out.mp4
ffmpeg -framerate 10 -i temp/output%02d.png -c:v libx264 -r 30 -pix_fmt yuv420p out.mp4
rm -f temp/output*.png
