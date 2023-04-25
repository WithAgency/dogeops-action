
# make a JSON object with the author's name and email
function make_author {
    local name="$1"
    local email="gonsa.carlos@gmail.com"
    echo "{\"name\": \"$name\", \"email\": \"$email\"}"
}

# make a JSON object with the commit's ref, sha, and message
function make_commit {
    local ref="$1"
    local sha="$2"
    local message="$3"
    echo "{\"ref\": \"$ref\", \"sha\": \"$sha\", \"message\": \"$message\"}"
}

function get_dogefile {
    local path="$1"

    if [[ ! -f "$path" ]]; then
        die "ERROR: Dogefile not found at $path"
    fi

    content="$(base64 "$path")"

    # return content as json
    echo "{\"base64\": \"$content\"}"
}

# make a JSON object with the context of the event
function make_context {
    local event="$1"
    local repo="$2"
    local author="$3"
    local commit="$4"
    local payload="${6:-null}"

    echo "{\"event\": \"$event\", \"repo\": \"$repo\", \"commit\": $commit, \"author\": $author, \"payload\": $payload}"
}

# parse doge options in commit message
# options are in the form of:
# '# doge: command [<option=value> ...]'
# e.g. '# doge: quiet'
function parse_doge_options {
    local message="$1"

    local command=""
    local options=""
    declare -a options_array
    while read -r line; do
        if [[ $line =~ ^#\ doge:\ (\w)(\ (.*))?$ ]]; then
            verbose "Found doge options in commit message"
            verbose "Line: $line"
            command="${BASH_REMATCH[1]}"
            command_options="${BASH_REMATCH[2]}"
            verbose "Command options: $command_options"
            options=$(echo "$command_options" | sed 's/^[^ ]* //; s/=/": "/g; s/^/{"/; s/$/"} /')
            options_array+=("$options")
            verbose "Command: $command"
            verbose "Parsed Options: $options"
        fi
    done <<<"$message"
    if [[ "x$command" != "x" ]]; then
        options="${options% }"
        printf '{"command":"%s",%s}' "$command" "$options"
    fi
    printf '{}'
}
