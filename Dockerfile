ARG PYTHON_VERSION=3.11
ARG POETRY_VERSION=1.4.1

FROM python:${PYTHON_VERSION}-alpine

RUN wget -O- https://install.python-poetry.org | POETRY_VERSION=${POETRY_VERSION} POETRY_HOME=/usr python -

LABEL org.opencontainers.image.description="GitHub Action to manage and deploy an application Doge-style"

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

CMD ["poetry", "run", "doge", "deploy"]
