# DogeOps : GitHub Action

This action will check the root of the repo for a file called `Dogefile` (yaml) and deploy
the requested components.

## Prerequisites

Environment variables for this action:
- `DOGEOPS_API_URL` : instance in charge of this project
- `DOGEOPS_API_KEY` : project API key

## Inputs

### `dogefile`

The path to the Dogefile. Default `"Dogefile"`.

## Commands

You may ask DogeOps to perform the following actions, by writing one of the following strings in the commit comment:
Doge Commands follow this regex: r"^# +doge: (?P<command>\w+)(?: (?P<args>.*))?$

Commands:
- `stay`: do not call DogeOps, skip this push
- `quiet`: don't notify default communication channels (Slack, Discord, etc.)
