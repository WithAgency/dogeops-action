ARG PYTHON_VERSION=3.10-bullseye

FROM python:${PYTHON_VERSION} as poetry

RUN curl -sSL https://install.python-poetry.org | POETRY_HOME=/usr python -

FROM poetry

RUN apt-get update  \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends libpq-dev gettext \
    && apt-get purge -y --auto-remove -o API::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random

COPY poetry.lock pyproject.toml /app/
RUN poetry config virtualenvs.in-project true --local \
    && poetry install --no-dev

CMD ["poetry", "run", "doge"]
