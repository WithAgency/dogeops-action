# Description: Helper functions for building the context of a doge event

source "$SCRIPT_DIR/_logging.sh"

function multiline_json {
    local data
    data="$1"

    # remove newlines
    data="$(sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\\\n/g' <<<"$data")"

    # escape double quotes
    data="$(perl -pe 's/(?<!\\)"/\\\"/g' <<<"$data")"

    verbose "Multiline JSON: $data"
    printf '%s' "$data"
}

# make a JSON object with the author's name and email
function make_author {
    local name="$1"
    local email="$2"

    printf '{"name": "%s", "email": "%s"}' "$name" "$email"
}

# make a JSON object with the commit's ref, sha, and message
function make_commit {
    local ref="$1"
    local sha="$2"
    local message="$3"
    printf '{"ref": "%s", "sha": "%s", "message": "%s"}' "$ref" "$sha" "$(multiline_json "$message")"
}

# retrieve the contents of the Dogefile
# converts the Dogefile to JSON
function get_dogefile {
    local path="$1"
    local content

    if [[ ! -f "$path" ]]; then
        die 1 "Dogefile not found at $path"
    fi

    content="$(yq . -o=json "$path" | jq -r -c .)"

    # return content as json
    #    content="$(multiline_json "$content" | yq eval . -o=json | jq -R .)"
    verbose "Dogefile: $content"
    printf '%s' "$content"
}

# make a JSON object with the context of the event
function make_context {
    local event="$1"
    local repo="$2"
    local author="$3"
    local commit="$4"
    local payload="${5:-null}"

    printf '{"event": "%s", "repo": "%s", "commit": %s, "author": %s, "payload": %s}' "$event" "$repo" "$commit" "$author" "$payload"
}

function print_array_as_json() {
    echo "{"
    declare -n __p="$1"
    for k in "${!__p[@]}"; do
        printf '"%s":"%s",\n' "$k" "${__p[$k]}"
    done
    echo "}"
}

# parse doge options in commit message
# options are in the form of:
# '# doge: command [<option=value> ...]'
# e.g. '# doge: bark volume=10 duration=5'
function parse_doge_options {
    local message="$1"

    local command=""
    declare -A options

    # Regular expression pattern for matching the specified string
    pattern="^# +doge: +([^[:space:]]+)(.*)$"

    # Loop through lines in the input
    while IFS= read -r line; do
        if [[ $line =~ $pattern ]]; then
            command="${BASH_REMATCH[1]}"     # Extract the command from the first capturing group
            option_list="${BASH_REMATCH[2]}" # Extract the option list from the second capturing group
            verbose "Command: $command"

            # Extract option names and values from the option list
            while [[ $option_list =~ ([[:alnum:]]+)=([^[:space:]]+) ]]; do
                option_name="${BASH_REMATCH[1]}"  # Extract the option name from the first capturing group
                option_value="${BASH_REMATCH[2]}" # Extract the option value from the second capturing group
                verbose "Option Name: $option_name"
                verbose "Option Value: $option_value"
                options["$option_name"]="$option_value"            # Add the option name-value pair to the options array
                option_list="${option_list#*"${BASH_REMATCH[0]}"}" # Remove the matched option name-value pair from the option list
            done
            break
        fi
    done <<<"$message"

    if [[ ! -z "$command" ]]; then
        # use yq to convert array to json, that has extra commas
        printf '{"command":"%s", "kwargs": %s}' "$command" "$(print_array_as_json options)" | yq eval .
    else
        printf '{}'
    fi
}
