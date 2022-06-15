PYTHON_BIN ?= poetry run

format: isort black

black:
	$(PYTHON_BIN) black src

isort:
	$(PYTHON_BIN) isort src
