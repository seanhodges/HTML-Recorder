#!/bin/bash
timeout="timeout"
if ["$(which ${timeout})" == ""]; then
    timeout="gtimeout"
fi
${timeout} --kill-after=10s 8s phantomjs --web-security=false ./takeposter.js $1 $2