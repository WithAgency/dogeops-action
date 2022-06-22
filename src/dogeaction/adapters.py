from enum import Enum

from actions_toolkit import github


class Event(str, Enum):
    PUSH = "push"
    MANUAL = "manual"


def get_repo(ctx):
    return {
        "repo": ctx.repo.repo,
        "owner": ctx.repo.owner,
    }


def get_issue(ctx):
    return {
        "owner": ctx.issue.owner,
        "repo": ctx.issue.repo,
        "number": ctx.issue.number,
    }


def get_committer(ctx):
    event = ctx.event_name
    payload = ctx.payload

    if event == "push":
        committer = {
            "username": payload["pusher"]["name"],
            "email": payload["pusher"]["email"],
        }
    else:
        raise ValueError(f"Events of type {event} are not supported yet")

    return committer


def get_commit(ctx):
    event = ctx.event_name

    if event == "push":
        commit = {
            "sha": ctx.sha,
            "ref": ctx.ref,
        }
    else:
        raise ValueError(f"Events of type {event} are not supported yet")

    return commit


def get_organization(ctx):
    event = ctx.event_name
    org = ctx.payload["organization"]

    if event == "push":
        organization = {
            "name": org["login"],
            "id": org["id"],
        }
    else:
        raise ValueError(f"Events of type {event} are not supported yet")

    return organization


def github_context(ctx: github.Context):
    payload = ctx.payload

    repo = get_repo(ctx)
    committer = get_committer(ctx)
    commit = get_commit(ctx)
    issue = get_issue(ctx)
    organization = get_organization(ctx)

    return {
        "event": ctx.event_name,
        "repo": repo,
        "committer": committer,
        "commit": commit,
        "issue": issue,
        "organization": organization,
        "payload": payload,
    }
