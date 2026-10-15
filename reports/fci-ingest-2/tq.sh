#!/bin/bash
# tq.sh slug page... : compact table view
cd /workspace/fci; rp=$(grep -o '"raw_path": "[^"]*' wiki/sources/$1.md|cut -d'"' -f4); shift
for p in "$@"; do echo "--- p$p"; pdftotext -layout -f $p -l $p "$rp" - 2>/dev/null | sed 's/  \+/  /g' | grep -E "Table [0-9]+|PF[A-Z][a-zA-Z]*[^a-z].*[0-9].*[0-9]|[Mm]ean|[Mm]edian|Range|Min|Max|GM|ng|pg|n =|LOD|LOQ|DF|%" | grep -vE "^.{200,}" | cut -c1-190; done
