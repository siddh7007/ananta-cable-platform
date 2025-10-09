#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1

  if [ -f "$HOME/.huskyrc" ]; then
    . "$HOME/.huskyrc"
  fi

  script_dir="$(dirname -- "$0")"
  if [ -f "$script_dir/h" ]; then
    . "$script_dir/h"
  fi
fi