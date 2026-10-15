#!/bin/bash
# usage: tp.sh slug  -> list candidate pages; tp.sh slug N -> print page N layout
cd /workspace/fci; f=wiki/sources/$1.md; rp=$(grep -o '"raw_path": "[^"]*' $f|cut -d'"' -f4)
if [ -z "$2" ]; then n=$(pdfinfo "$rp"|awk '/Pages/{print $2}'); for i in $(seq 1 $n); do t=$(pdftotext -layout -f $i -l $i "$rp" - 2>/dev/null); c=$(echo "$t"|grep -oE "^\s*Table [0-9S]+[^a-z]{0,3}" | tr -s ' '|tr '\n' ';'); a=$(echo "$t"|grep -cE "PFOA|PFOS"); [ -n "$c" ] && echo "p$i [$c] pfas_lines=$a"; done
else pdftotext -layout -f $2 -l $2 "$rp" - | sed 's/  \+/  /g' | grep -v "^\s*$"; fi
