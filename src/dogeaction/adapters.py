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


def get_pusher(ctx) -> dm.Pusher:
    event = ctx.event_name
    payload = ctx.payload

    if "pusher" in payload:
        committer = dm.Pusher(
            username=payload["pusher"]["name"],
            email=payload["pusher"]["email"],
        )
    else:
        raise ValueError(
            f"Unsupported event type: {event}, because it contains no pusher information"
        )

    return committer


def get_commit(ctx) -> dm.Commit:
    event = ctx.event_name

    commit = dm.Commit(
        sha=ctx.sha,
        ref=ctx.ref,
    )

    return commit


def get_organization(ctx) -> dm.Organization:
    event = ctx.event_name

    if org := ctx.payload.get("organization"):
        organization = dm.Organization(
            name=org["login"],
            id=org["id"],
        )
    else:
        raise ValueError(
            f"Unsupported event type: {event}, because it contains no organization information"
        )

    return organization


def from_github_context(ctx: github.Context) -> dm.Context:
    payload = ctx.payload

    repo = get_repo(ctx)
    pusher = get_pusher(ctx)
    commit = get_commit(ctx)
    issue = get_issue(ctx)
    organization = get_organization(ctx)

    return dm.Context(
        event=ctx.event_name,
        repo=repo,
        pusher=pusher,
        commit=commit,
        issue=issue,
        organization=organization,
        payload=payload,
    )
