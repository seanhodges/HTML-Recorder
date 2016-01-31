#!/bin/bash

export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/
Xvfb :10 -screen 0 1024x768x24 +extension RANDR -ac &>xvfb_out.log &
export DISPLAY=:10