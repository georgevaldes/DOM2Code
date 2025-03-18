#!/bin/bash

# Clean up any previous zip file
rm -f ../dom2code-chrome-extension.zip

# Create a zip file of the Chrome extension
cd chrome-extension
zip -r ../dom2code-chrome-extension.zip \
  README.md \
  background.js \
  content.js \
  manifest.json \
  popup.html \
  popup.js \
  styles.css \
  icons/*.svg
cd ..

echo "Chrome extension packaged as dom2code-chrome-extension.zip" 