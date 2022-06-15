import os
from typing import Optional

from typefit import api
from typefit.httpx_models import HeaderTypes


class DogeApi(api.SyncClient):

    BASE_URL = os.environ["DOGEOPS_API_URL"]

    def __init__(self, token: str):
        super().__init__()
        self._token = token

    def headers(self) -> Optional[HeaderTypes]:
        return {"X-API-KEY": self._token}

    @api.get("api/ping/")
    def ping(self) -> str:
        """Ping the API"""
