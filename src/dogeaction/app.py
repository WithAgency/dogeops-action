import os
from pathlib import Path
from typing import Any, Optional

import yaml
from actions_toolkit import core, github

from dogeaction.api import DogeApi
from dogeaction.models import Deployment

WORKSPACE = Path(os.getenv("GITHUB_WORKSPACE", "/github/workspace"))


def has_file(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(manifest: str, ctx: dict[str, Any]) -> Optional[Deployment]:
    if not has_file(manifest):
        return None

    api = DogeApi(os.environ["DOGEOPS_API_KEY"])
    with open(manifest) as man:
        spec = yaml.safe_load(man)
        deployment = api.deploy(context=ctx, manifest=spec)

    return deployment


def filter_context(ctx: github.Context):
    return {
        "payload": ctx.payload,
        "event_name": ctx.event_name,
        "sha": ctx.sha,
        "ref": ctx.ref,
        "workflow": ctx.workflow,
        "action": ctx.action,
        "job": ctx.job,
        "run_number": ctx.run_number,
        "run_id": ctx.run_id,
        "api_url": ctx.api_url,
        "server_url": ctx.server_url,
        "graphql_url": ctx.graphql_url,
        "repo": {
            "repo": ctx.repo.repo,
            "owner": ctx.repo.owner,
        }
        if ctx.repo
        else {},
        "issue": {
            "owner": ctx.issue.owner,
            "repo": ctx.issue.repo,
            "number": ctx.issue.number,
        }
        if ctx.issue
        else {},
    }


def main():
    name = core.get_input("manifest")
    doge_file = f"{WORKSPACE / name}"

    ctx = filter_context(github.Context())
    # ctx = serialize(ctx)
    core.info(f"{ctx=}")

    deployment = upload_manifest(doge_file, ctx)
    if not deployment:
        core.set_failed(f"{doge_file} does not exist")
    else:
        out = {}
        for component in deployment.components:
            out[component.name] = component.url
