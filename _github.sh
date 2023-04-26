# Description: GitHub Actions helper functions

source "$SCRIPT_DIR/_logging.sh"

# get GitHub inputs
function github_input {
    local name="$1"
    local default="$2"
    # convert to caps and underscores
    name="$(echo "$name" | tr ' ' '_' | tr '[:lower:]' '[:upper:]')"
    name="INPUT_${name}"
    verbose "Calling github_input with name=$name, default=$default"

    local value="${!name}"

    if [[ -z "$value" ]]; then
        verbose "Using default value"
        value="$default"
    fi
    verbose "GH Input value: $value"
    echo "$value"
}
