#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

source "$SCRIPT_DIR/_github.sh"
source "$SCRIPT_DIR/_context.sh"

function set_shell_options {
    # More safety, by turning some bugs into errors.
    # Without `errexit` you don’t need ! and can replace
    # ${PIPESTATUS[0]} with a simple $?, but I prefer safety.
    #set -o errexit
    set -o pipefail
    set -o noclobber
    set -o nounset

    # -allow a command to fail with !’s side effect on errexit
    # -use return value from ${PIPESTATUS[0]}, because ! hosed $?
    ! getopt --test >/dev/null
    if [[ ${PIPESTATUS[0]} -ne 4 ]]; then
        die 1 '`getopt --test` failed in this environment.'
    fi
}

# Print usage information
function usage {
    echo "Usage: ${BASH_SOURCE[0]} [options]"
    echo "Options:"
    echo "  -d, --dogefile <path>  Path to the Dogefile to use"
    echo "  -e, --event <name>     Name of the event to trigger"
    echo "  -r, --repo <path>      Path to the repository to use"
    echo "  -v, --verbose          Print verbose output"
}

# defaults
dogefile="Dogefile"
event=${GITHUB_EVENT_NAME:-"push"}
repo="."
verbose=n

function parse_input_args {
    # Parse CLI arguments
    # option --dogefile/-f requires 1 argument
    # option --event/-e requires 1 argument
    # option --repo/-r requires 1 argument
    # option --verbose/-v requires 0 arguments
    LONG_OPTS=dogefile:,event:,repo:,verbose
    OPTIONS=d:e:r:v

    # -regarding ! and PIPESTATUS see above
    # -temporarily store output to be able to check for errors
    # -activate quoting/enhanced mode (e.g. by writing out “--options”)
    # -pass arguments only via   -- "$@"   to separate them correctly
    ! PARSED=$(getopt --options=$OPTIONS --longoptions=$LONG_OPTS --name "$0" -- "$@")
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        # e.g. return value is 1
        #  then getopt has complained about wrong arguments to stdout
        exit 2
    fi
    # read getopt’s output this way to handle the quoting right:
    eval set -- "$PARSED"

    # parse input arguments
    # we parse the
    # options in order and nicely split until we see --
    while true; do
        case "$1" in
        -d | --dogefile)
            # overrides the default dogefile
            dogefile="$2"
            shift 2
            ;;
        -v | --verbose)
            verbose=y
            shift
            ;;
        -e | --event)
            event="$2"
            shift 2
            ;;
        -r | --repo)
            repo="$2"
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "Unrecognized argument: $1"
            usage
            exit 3
            ;;
        esac
    done
}
parse_input_args "$@"

source "$SCRIPT_DIR/_logging.sh"
verbose "Verbose mode on"

dogefile="$(github_input "Dogefile" "$dogefile")"

# resolve paths
repo="$(realpath -e "$repo")"
# check if git repo
if [[ ! -d "$repo/.git" ]]; then
    die 1 "Not a git repository: $repo"
fi

dogefile="$(realpath -e "$dogefile")"
# check if dogefile exists
if [[ ! -f "$dogefile" ]]; then
    die 1 "Dogefile not found: $dogefile"
fi

source "$SCRIPT_DIR/_api.sh"
source "$SCRIPT_DIR/_outcome.sh"

# Now do something with the options
verbose "Dogefile: $dogefile"
verbose "Event: $event"
verbose "Repo: $repo"

function main {
    local repo
    local author
    local committer_name
    local committer_email
    local commit
    local branch
    local sha
    local message
    local payload
    local context
    local options
    local repo_url

    # repo
    repo_url="$(git remote get-url origin)"
    branch="$(git symbolic-ref HEAD)"
    sha="$(git rev-parse HEAD)"
    # committer
    committer_email="$(git log -1 --pretty=format:'%ae')"
    committer_name="$(git log -1 --pretty=format:'%an')"
    # commit
    message="$(git log -1 --pretty=%B)"
    # payload (optional)
    payload="{}"
    if [ ! -z "$GITHUB_EVENT_PATH" ]; then
        payload="$(cat "${GITHUB_EVENT_PATH}")"
    fi

    event="$event"
    author="$(make_author "$committer_name" "$committer_email")"
    commit="$(make_commit "$branch" "$sha" "$message")"
    dogefile="$(get_dogefile "$dogefile")"

    context="$(make_context "$event" "$repo_url" "$author" "$commit" "$payload")"

    make_body "$context" "$dogefile"
}

# run main if this script is being run directly, not sourced
if [ "$0" = "${BASH_SOURCE[0]}" ]; then
    set_shell_options

    auth="$(make_auth)"

    cd "$repo" || die 1 "Could not cd to $repo"
    body=$(main)
    cd - >/dev/null || die 1 "Could not cd back to $OLDPWD"

    response=$(post_request "$body" "$auth")
    status=$?
    # if there was an http error >256, the status code will overflow the
    # 8-bit integer of the return type, so we need to add 256 to get the
    # actual status code
    # if the status code is 200/201, it fits in the 8-bit integer
    if [[ $status -lt 200 || $status -gt 201 ]]; then
        fail_message
        # add 256 to status code to get the exit code
        die 2 "Request failed with code $((status + 256))"
    fi
    success_message "$(jq -r .progress_url <<<"$response")"
fi
