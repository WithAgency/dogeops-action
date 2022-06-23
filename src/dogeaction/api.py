import os
from functools import lru_cache
from typing import Any, Optional

from typefit import api
from typefit.httpx_models import HeaderTypes

from dogeaction.models import Deployment, Project


class DogeApi(api.SyncClient):

    BASE_URL = os.environ["DOGEOPS_API_URL"]

    def __init__(self, token: str):
        super().__init__()
        self._token = token

    def headers(self) -> Optional[HeaderTypes]:
        return {"X-API-KEY": self._token}

    def extract(self, data: Any, hint: Any) -> Any:
        """
        Extract paginated data from the response. If the response does not contain
        pagination data, return the data as is.

        :param data: Response data
        :param hint: Hint for the type of the response data
        :return:
        """
        try:
            if {"results", "next", "previous", "count"} == set(data.keys()):
                return data["results"]
        except (ValueError, Exception):
            pass

        return data

    def __make_deployment(  # noqa
        self,
        project_id: str,
        context: dict[str, Any],
        manifest: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "project": project_id,
            "context": context,
            "manifest": manifest,
        }

    @api.post("api/deployment/", json=__make_deployment)
    def deploy(
        self,
        project_id: str,
        context: dict[str, Any],
        manifest: dict[str, Any],
    ) -> Deployment:
        pass

    @lru_cache
    @api.get("api/project/")
    def list_projects(self, hint="projects") -> list[Project]:
        pass

    def project(self, url: str) -> Optional[Project]:
        for p in self.list_projects():
            if p.repo == url:
                return p
