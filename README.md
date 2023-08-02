# DogeOps : GitHub Action

This action will check the root of the repo for a file called `Dogefile` (yaml) and deploy
the requested components.

## Prerequisites

Get your API Key and API URL from the DogeOps instance you want to use:
- `DOGEOPS_API_URL` : instance in charge of this project
- `DOGEOPS_API_KEY` : project API key

In the GitHub workflow responsible for calling DogeOps, make sure you checkout the repo
with `fetch-depth: 0` so that the `.git` folder and `Dogefile` are available.

## Usage

A typical and minimal workflow example:

```yaml
---
name: Bootstrap DogeOps

on:
  push:
    paths:
      - "api/**"
      - "front/**"
      - "Dogefile"
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
            fetch-depth: 0

      - name: Deploy though DogeOps
        uses: WithAgency/dogeops-action@v1
        with:
          api_url: ${{ vars.DOGEOPS_API_URL }}  # from organization or repository variables
          api_key: ${{ secrets.DOGEOPS_API_KEY }}  # from repository secrets
          dogefile: "Dogefile"  # default
```

## Inputs

### `dogefile`

The path to the Dogefile. Default `"Dogefile"`.

### `api_url`

The base URL of the DogeOps instance.
It will probably be `"https://develop.dogeops.dev"` for a time, but it can
be configured organization-wide in a GitHub Variable and passed on to the jobs.

### `api_key`

The API key for the project. It should be configured as a GitHub Secret and
passed on to the jobs.
Each project has its own API key, on each DogeOps instance. If you switch instances,
it's more than likely that you'll need to change the API key, too.

# Development

Put the following in your `.env`:

```bash
set -a

GITHUB_ACTIONS=true
ACTIONS_STEP_DEBUG=true
GITHUB_EVENT_NAME=push
GITHUB_WORKSPACE="a repo local path"
GITHUB_REF_NAME=develop
GITHUB_REF=refs/heads/develop

INPUT_VERBOSE="true"
INPUT_API_URL="DogeOps API URL"
INPUT_API_KEY="Your API key"
INPUT_DOGEFILE="Dogefile"
```

Then run `npm run package` to build the action.
You can then run `node dist/index.js` to test it.
