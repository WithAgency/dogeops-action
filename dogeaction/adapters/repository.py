from git import Repo

from dogeaction.adapters import GitUrls
from dogeaction.models import dogeops as dm


def get_origin_url(repo: Repo) -> GitUrls:
    """
    Get the origin url from the git repo.
    """
    config = repo.config_reader("repository")
    url = config.get_value('remote "origin"', "url", None)
    if url is None:
        raise ValueError("No remote origin found in .git/config")

    urls = GitUrls(url)
    return urls


def from_git_repo(event: str, repo: str = None) -> dm.Context:
    """
    Build a DogeOps context from a Git repo. Without using github package or environment variables.
    from the .git directory and properties
    """
    repo = Repo(repo or ".")
    commit = repo.head.commit
    ref = repo.head.reference

    committer = dm.Author(commit.committer.name, commit.committer.email)

    urls = get_origin_url(repo)

    return dm.Context(
        event=event,
        repo=dm.Repo(
            repo=repo.working_dir,
            ref=ref.path,
            url=urls.http,
        ),
        commit=dm.Commit(
            sha=commit.hexsha,
            message=commit.message,
            ref=ref.path,
            # branch=repo.refs.as_dict()[b"HEAD"].decode(),
            # author=dm.Author(
            #     name=repo.get_object(repo.head()).author.decode(),
            #     email=repo.get_object(repo.head()).author.decode(),
            # ),
        ),
        author=committer,
    )
