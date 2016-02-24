#!/bin/bash
timeout --kill-after=3s 2s phantomjs --web-security=false ./takeposter.js $1 $2
