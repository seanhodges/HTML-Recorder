#!/bin/bash

rm temp/output*.png
FRAMECOUNT=$(swfdump -D input1.swf | grep "Frame count" | cut -d ':' -f 2)
echo Frame count: $FRAMECOUNT

FRAMES=$(seq -w -s, 0 1 $FRAMECOUNT)
gnash -s1 --screenshot $FRAMES --screenshot-file temp/output%f.png -1 -r1 --timeout 10 input1.swf
mv temp/output0.png temp/output00.png
mv temp/output1.png temp/output01.png
mv temp/output2.png temp/output02.png
mv temp/output3.png temp/output03.png
mv temp/output4.png temp/output04.png
mv temp/output5.png temp/output05.png
mv temp/output6.png temp/output06.png
mv temp/output7.png temp/output07.png
mv temp/output8.png temp/output08.png
mv temp/output9.png temp/output09.png

avconv -framerate 10 -i temp/output%02d.png -c:v libx264 -r 30 -pix_fmt yuv420p out.mp4
