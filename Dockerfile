ARG PYTHON_VERSION=3.11
ARG POETRY_VERSION=1.2.2

FROM python:${PYTHON_VERSION}-bullseye as poetry

RUN curl -sSL https://install.python-poetry.org | POETRY_VERSION=${POETRY_VERSION} POETRY_HOME=/usr python -

FROM poetry

RUN apt-get update  \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends libpq-dev gettext \
    && apt-get purge -y --auto-remove -o API::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod u+x /entrypoint.sh

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PYTHONPATH=/app

COPY poetry.lock pyproject.toml /app/
RUN poetry config virtualenvs.in-project true --local
RUN poetry install --only main --no-ansi

COPY ./src/ .

ENTRYPOINT ["/entrypoint.sh"]

CMD ["poetry", "run", "doge"]
