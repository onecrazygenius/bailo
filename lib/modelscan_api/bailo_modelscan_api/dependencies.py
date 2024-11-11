"""Common utilities used by the FastAPI app.
"""

from __future__ import annotations

import logging
from pathlib import Path

from requests import Response

logger = logging.getLogger(__name__)


class ResponsePath:
    def __init__(self, response: Response, path: Path) -> None:
        self.response = response
        self.path = path


def parse_path(path: str | Path | None) -> Path:
    """Ensure that a path is consistently represented as a Path.

    :param path: System path to parse. Defaults to the file's current working directory if unspecified.
    :return: An absolute Path representation of the path parameter.
    """
    logger.info("Parsing path.")
    if path is None:
        path = "."
    return Path().cwd() if path == "." else Path(path).absolute()
