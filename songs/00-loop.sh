#!/bin/bash

# Define the hardcoded directory
TARGET_DIR="."

# Loop through all .txt files in that directory
for file in "$TARGET_DIR"/*.txt; do
    # Check if any .txt files actually exist to avoid errors
    [ -e "$file" ] || continue
    
    # Run your python script on each text file
    ./01-song2html.py "$file"
done
 
