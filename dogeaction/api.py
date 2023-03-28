import os
from typing import Any, Optional

from typefit import api
from typefit.httpx_models import HeaderTypes

from dogeaction.models.dogeops import (
    Context,
    Deployment,
    DeploymentRequest,
    Options,
    Project,
)

API_URL = os.environ["DOGEOPS_API_URL"]


class DogeApi(api.SyncClient):

    BASE_URL = API_URL

    def __init__(self, token: str):
        super().__init__()
        self._token = token

    def headers(self) -> Optional[HeaderTypes]:
        """
        Authorization via API Key.
        """
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
            # data contains at least these keys
            if (
                len(
                    {"results", "next", "previous", "count"}.intersection(
                        set(data.keys())
                    )
                )
                == 4
            ):
                return data["results"]
        except (ValueError, Exception):
            pass

        return data

    def __make_deployment(  # noqa
        self,
        context: Context,
        dogefile: dict[str, Any],
        options: Options,
    ) -> DeploymentRequest:
        return DeploymentRequest(
            context=context,
            dogefile=dogefile,
            options=options,
        )

    @api.post("back/api/paas/deployment/", json=__make_deployment)  # noqa
    def deploy(
        self,
        context: Context,
        dogefile: dict[str, Any],
        options: Options,
    ) -> Deployment:
        """
        Use the manifest and the context to create a new deployment for
        this project.
        """
