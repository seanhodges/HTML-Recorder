#!/bin/bash
rm -f temp/output*.png
phantomjs ./phantomrecorder.js $1 $2 $3 $4 $5
rm -f out.mp4
if [ "$4" != "true" ]; then
avconv -framerate 10 -i temp/output%02d.png -c:v libx264 -r 30 -pix_fmt yuv420p out.mp4
fi
