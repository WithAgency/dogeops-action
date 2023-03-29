ARG PYTHON_VERSION=3.11
ARG POETRY_VERSION=1.4.1

FROM python:${PYTHON_VERSION}-alpine

RUN apk add --no-cache git \
    && wget -O- https://install.python-poetry.org | POETRY_VERSION=${POETRY_VERSION} POETRY_HOME=/usr python -

LABEL org.opencontainers.image.description="GitHub Action to manage and deploy an application Doge-style"

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod u+x /entrypoint.sh

ENV PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PYTHONPATH=/app

WORKDIR /app
COPY poetry.lock pyproject.toml ./
RUN mkdir dogeaction && touch dogeaction/__init__.py \
    && poetry config virtualenvs.in-project true --local \
    && poetry install --only main --no-ansi

COPY . .

ENTRYPOINT ["/entrypoint.sh"]

CMD ["poetry", "run", "doge", "ci"]
