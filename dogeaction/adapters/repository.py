from pathlib import Path

from git import Repo

from dogeaction.models import dogeops as dm


def get_repo_context(event: str, repo: Path) -> dm.Context:
    """
    Gather information from the Git repo to pass on to DogeOps as Context.
    """

    repo = Repo(repo)
    commit = repo.head.commit
    ref = repo.head.reference

    return dm.Context(
        event=event,
        repo=repo.remotes.origin.url,
        author=dm.Author(commit.committer.name, commit.committer.email),
        commit=dm.Commit(
            ref=ref.path,
            sha=commit.hexsha,
            message=commit.message,
        ),
    )
