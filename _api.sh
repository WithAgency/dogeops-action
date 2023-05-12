source "$(dirname "$0")/_logging.sh"

# API configs come from environment variables
if [[ -z "$DOGEOPS_API_URL" ]]; then
    die 1 "DOGEOPS_API_URL is not set"
fi

if [[ -z "$DOGEOPS_API_KEY" ]]; then
    die 1 "DOGEOPS_API_KEY is not set"
fi

function make_auth {
    local api_key="${1:-"$DOGEOPS_API_KEY"}"
    echo "X-Api-Key: $api_key"
}

function make_body {
    local context="$1"
    local dogefile="$2"

    printf '{"context": %s, "dogefile": %s}' "$context" "$dogefile"
}

function make_request {
    local url="$1"
    local method="$2"
    local data="$3"
    local auth="$4"
    local response
    verbose "Request: $method $url"

    # http_code will be the last line of the response
    response=$(curl --write-out "\n%{http_code}\n" --silent --data "$data" -X "$method" --header "$auth" --header "Content-Type: application/json" "$url")

    local http_code
    # get the code from the last line
    http_code="$(echo "$response" | tail -n1)"
    # remove the last line
    response=$(echo "$response" | head -n-1)

    verbose "Status code: $http_code"

    echo "$response"
    return "$http_code"
}

# Perform a POST request to the API
function post_request {
    local data="$1"
    local auth="$2"
    local path="${3:-"/back/api/paas/deployment/"}"
    local url="${4:-"$DOGEOPS_API_URL"}"

    local response
    local status

    verbose "Making POST request to $url"
    verbose "Path: $path"
    verbose "Data: $data"

    response="$(make_request "${url}${path}" "POST" "$data" "$auth")"
    status=$?
    echo "$response"
    return "$status"
}
