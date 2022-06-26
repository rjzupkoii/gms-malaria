#!/bin/bash

# Basic script for refreshing the Google and GitHub repositories.

# Print usage
if [ -z $1 ]; then
	echo "Usage: ./refresh.sh [command]"
	echo
	echo "github - refreshes from GitHub to Google"
	echo "google - refreshes from Google to GitHub"
	exit
fi

# Refresh from GitHub to Google
if [ $1 = 'github' ]; then
	git pull github
	git push origin
	exit
fi

# Refresh from Google to GitHub
if [ $1 = 'google' ]; then
	git pull origin
	git push github
	exit
fi

echo "Unknown command, $1"
