#!/bin/bash

URL=$1
WIDTH=$2
HEIGHT=$3
FRAME=$4
EXTRA=$5

rm -f temp/output*.png
phantomjs --debug=true --ignore-ssl-errors=true ./phantomrecorder.js $URL $WIDTH $HEIGHT $FRAME $EXTRA
rm -f out.mp4 out.gif
if [ "$4" != "png" ]; then
	avconv -framerate 10 -i temp/output%02d.png -c:v libx264 -r 30 -pix_fmt yuv420p out.mp4
fi
if [ "$4" == "gif" ]; then
avconv -i out.mp4 -pix_fmt rgb24 out.gif
fi
