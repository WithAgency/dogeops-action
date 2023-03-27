ARG PYTHON_VERSION=3.11
ARG POETRY_VERSION=1.4.1

FROM python:${PYTHON_VERSION}-alpine as poetry

RUN wget -O- https://install.python-poetry.org | POETRY_VERSION=${POETRY_VERSION} POETRY_HOME=/usr python -

FROM poetry as runtime

LABEL org.opencontainers.image.description="GitHub Action to manage and deploy an application Doge-style"

#RUN apt-get update  \
#    && apt-get upgrade -y \
#    && apt-get install -y --no-install-recommends libpq-dev gettext \
#    && apt-get purge -y --auto-remove -o API::AutoRemove::RecommendsImportant=false \
#    && rm -rf /var/lib/apt/lists/*

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod u+x /entrypoint.sh

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PYTHONPATH=/app

COPY poetry.lock pyproject.toml ./
RUN mkdir dogeaction && touch dogeaction/__init__.py \
    && poetry config virtualenvs.in-project true --local \
    && poetry install --only main --no-ansi

COPY . .

ENTRYPOINT ["/entrypoint.sh"]

CMD ["poetry", "run", "deploy"]
