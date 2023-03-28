from actions_toolkit import github

from dogeaction.models import dogeops as dm


def get_repo(ctx) -> dm.Repo:
    """
    Get the repo from the github context.
    """
    return dm.Repo(
        repo=ctx.repo.repo,
        ref=ctx.ref,
        url=f"{ctx.server_url}/{ctx.repo.owner}/{ctx.repo.repo}",
    )


def get_author(ctx) -> dm.Author:
    """
    Get the author from the github context.
    """
    event = ctx.event_name
    payload = ctx.payload

    if event == "push":
        user = payload["author"]
        committer = dm.Author(
            name=user["name"],
            email=user["email"],
        )
    else:
        raise ValueError(
            f"Unsupported event type: {event}, because it contains no pusher information"
        )

    return committer


def get_commit(ctx) -> dm.Commit:
    """
    Get the commit from the github context.
    """
    commit = dm.Commit(
        sha=ctx.sha,
        ref=ctx.ref,
        message=ctx.payload["head_commit"]["message"],
    )

    return commit


def get_organization(ctx) -> dm.Organization:
    event = ctx.event_name

    if org := ctx.payload.get("organization"):
        organization = dm.Organization(
            name=org["login"],
        )
    else:
        raise ValueError(
            f"Unsupported event type: {event}, because it contains no organization information"
        )

    return organization


def from_github(event: str) -> dm.Context:
    ctx = github.Context()
    payload = ctx.payload

    repo = get_repo(ctx)
    author = get_author(ctx)
    commit = get_commit(ctx)
    organization = get_organization(ctx)

    return dm.Context(
        event=event,
        repo=repo,
        author=author,
        commit=commit,
        organization=organization,
        payload=payload,
    )
