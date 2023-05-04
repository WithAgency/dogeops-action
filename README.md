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

## Commands

You may ask DogeOps to perform the following actions, by writing one of the following strings in the commit comment:
Doge Commands follow this regex: r"^# +doge: (?P<command>\w+)(?: (?P<args>.*))?$

Commands:
- `ignore`: ignore this commit. DogeOps will still be called, but will not deploy anything and will mark the Deployment as 'canceled'.
- `quiet`: don't notify the default communication channels (Slack, Discord, etc.)
