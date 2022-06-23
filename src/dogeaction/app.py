import json
import os
from pathlib import Path
from typing import Any, Optional

import yaml
from actions_toolkit import core, github

from dogeaction.adapters import github_context
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

    project = api.project(url=ctx["repo"]["url"])
    core.info(f"{project}")

    with open(manifest) as man:
        spec = yaml.safe_load(man)
        deployment = api.deploy(project_id=project.id, context=ctx, manifest=spec)

    return deployment


def make_project(ctx: github.Context):
    return github_context(ctx)


def main():
    name = core.get_input("manifest")
    doge_file = f"{WORKSPACE / name}"

    ctx = make_project(github.Context())

    deployment = upload_manifest(doge_file, ctx)
    if not deployment:
        core.set_failed(f"{doge_file} does not exist")
    else:
        out = {}
        for component in deployment.components:
            out[component.name] = component.url

        core.set_output("components", json.dumps(out))
