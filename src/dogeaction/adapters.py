from enum import Enum

from actions_toolkit import github

from .models import dogeops as dm


class Event(str, Enum):
    PUSH = "push"
    MANUAL = "manual"


def get_repo(ctx) -> dm.Repo:
    return dm.Repo(
        repo=ctx.repo.repo,
        owner=ctx.repo.owner,
        ref=ctx.ref,
        url=f"{ctx.server_url}/{ctx.repo.owner}/{ctx.repo.repo}.git",
    )


def get_issue(ctx) -> dm.Issue:
    return dm.Issue(
        owner=ctx.issue.owner,
        repo=ctx.issue.repo,
        number=ctx.issue.number,
    )


def get_committer(ctx) -> dm.Committer:
    event = ctx.event_name
    payload = ctx.payload

    if event == "push":
        committer = dm.Committer(
            username=payload["pusher"]["name"],
            email=payload["pusher"]["email"],
        )
    else:
        raise ValueError(f"Events of type {event} are not supported yet")

    return committer


def get_commit(ctx) -> dm.Commit:
    event = ctx.event_name

    if event == "push":
        commit = dm.Commit(
            sha=ctx.sha,
            ref=ctx.ref,
        )
    else:
        raise ValueError(f"Events of type {event} are not supported yet")

    return commit


def get_organization(ctx) -> dm.Organization:
    event = ctx.event_name
    org = ctx.payload["organization"]

    if event == "push":
        organization = dm.Organization(
            name=org["login"],
            id=org["id"],
        )
    else:
        raise ValueError(f"Events of type {event} are not supported yet")

    return organization


def from_github_context(ctx: github.Context) -> dm.Context:
    payload = ctx.payload

    repo = get_repo(ctx)
    committer = get_committer(ctx)
    commit = get_commit(ctx)
    issue = get_issue(ctx)
    organization = get_organization(ctx)

    return dm.Context(
        event=ctx.event_name,
        repo=repo,
        committer=committer,
        commit=commit,
        issue=issue,
        organization=organization,
        payload=payload,
    )
