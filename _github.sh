# get GitHub inputs
function github_input {
    local name="$1"
    local default="$2"
    # convert to caps and underscores
    name="$(echo "$name" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')"
    name="INPUT_${name}"
    echo "$name"

    local value="${!name:-$default}"
    if [[ -z "$value" ]]; then
        echo "INPUT_$name is not set" >&2
        exit 1
    fi
    echo "$value"
}
