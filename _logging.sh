# Description: Logging functions

# declare an associative array to store the colors
declare -A COLORS
COLORS[reset]="\e[0m"
COLORS[green]="\e[38;5;46m"
COLORS[red]="\e[38;5;196m"
COLORS[blue]="\e[38;5;27m"
COLORS[gray]="\e[38;5;240m"

# exit the program with an error message
function die {
    local exit_code="${1:1}"
    shift
    err "$@" >&2
    exit "$exit_code"
}

# print a message if verbose mode is on
function verbose {
    if [[ "$verbose" == "y" ]]; then
        while read -r line; do
            echo -e "${COLORS[gray]}[DBG]  ${line}${COLORS["reset"]}" >&2
        done <<<"$@"
    fi
}

# info message
function info {
    while read -r line; do
        echo -e "${COLORS[blue]}[INF]  ${line}${COLORS["reset"]}" >&2
    done <<<"$@"
}

# error message
function err {
    while read -r line; do
        echo -e "${COLORS[red]}[ERR]  ${line}${COLORS["reset"]}" >&2
    done <<<"$@"
}

# success message
function success {
    while read -r line; do
        echo -e "${COLORS[green]}[OK]   ${line}${COLORS["reset"]}" >&2
    done <<<"$@"
}
