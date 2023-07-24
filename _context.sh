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

function get_git_ref {
    local repo="$1"
    local ref
    ref="$(git symbolic-ref HEAD)"
    printf '%s' "$ref"
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
