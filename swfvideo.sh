#!/bin/bash

URL=$1
WIDTH=$2
HEIGHT=$3
MODE=$4
EXTRA=$5

if [ "$MODE" == "png" ]; then
	wget --output-document=temp/input.swf $URL

	FRAME=$EXTRA
	if [ "$FRAME" == "" ]; then
		FRAME=$(swfdump -D temp/input.swf | grep "Frame count" | cut -d ':' -f 2)
	fi
	echo Frame count: $FRAME

	rm temp/output*.png
	FRAMES=$(seq -w -s, 0 1 $FRAME)
	echo $FRAMES
	gnash -s1 --screenshot $FRAMES --screenshot-file temp/output%f.png -1 -r1 --timeout 30 --max-advances=$FRAME temp/input.swf
	if [ -f temp/output0.png ]; then mv temp/output0.png temp/output00.png; fi
	if [ -f temp/output1.png ]; then mv temp/output1.png temp/output01.png; fi
	if [ -f temp/output2.png ]; then mv temp/output2.png temp/output02.png; fi
	if [ -f temp/output3.png ]; then mv temp/output3.png temp/output03.png; fi
	if [ -f temp/output4.png ]; then mv temp/output4.png temp/output04.png; fi
	if [ -f temp/output5.png ]; then mv temp/output5.png temp/output05.png; fi
	if [ -f temp/output6.png ]; then mv temp/output6.png temp/output06.png; fi
	if [ -f temp/output7.png ]; then mv temp/output7.png temp/output07.png; fi
	if [ -f temp/output8.png ]; then mv temp/output8.png temp/output08.png; fi
	if [ -f temp/output9.png ]; then mv temp/output9.png temp/output09.png; fi

elif [ "$MODE" == "mp4" ]; then
	rm -f out.mp4 temp/input.raw
	dump-gnash -1 -D temp/input.raw $URL
	avconv -f rawvideo -pix_fmt rgb32 -s:v ${WIDTH}x${HEIGHT} -r 100 -i temp/input.raw -c:v libx264 -r 100 out.mp4

elif [ "$MODE" == "gif" ]; then
	rm -f out.gif temp/input.raw
	dump-gnash -1 -D temp/input.raw $URL
	avconv -f rawvideo -pix_fmt rgb32 -s:v ${WIDTH}x${HEIGHT} -r 100 -i temp/input.raw -pix_fmt rgb24 -r 10 -s ${WIDTH}x${HEIGHT} -t 00:00:10.000 out.gif
fi
