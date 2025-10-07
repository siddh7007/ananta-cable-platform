#!/bin/sh
# shellcheck shell=sh

if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1

  if [ "$HUSKY" = "0" ]; then
    exit 0
  fi

  if [ "$HUSKY_USE_TTY" = "true" ] && [ -t 1 ]; then
    exec < /dev/tty
  fi

  if [ -f ~/.huskyrc ]; then
    . ~/.huskyrc
  fi
fi
