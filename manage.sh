#!/bin/bash
BASE="$(cd `dirname "$0"` && pwd)"
TEST="$BASE/test"

fail () {
	echo "$@" >&2
	exit 1
}

ensure_dir () {
    if ! [ -d "$1" ]; then
        mkdir -p -- "$1" || fail "couldn't create directory $1"
    fi
}

main () {
    local cmd="$1"
    case $cmd in
        'test')
            shift
            runtests "$@"
            ;;
        'setup')
            shift
            setup "$@"
            ;;
        'publish')
            shift
            publish "$@"
            ;;
        * )
            echo "exiting without running any operations"
            ;;
    esac
}

setup () {
    npm "install"
}

runtests () {
    setup
    node "$TEST/runtests.js"
}

publish () {
    npm publish
}

main "$@"
