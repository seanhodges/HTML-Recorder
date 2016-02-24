#!/bin/bash
timeout 2s phantomjs --web-security=false ./takeposter.js $1 $2
