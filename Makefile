PYTHON_BIN ?= poetry run

format: isort black

black:
	$(PYTHON_BIN) black dogeaction

isort:
	$(PYTHON_BIN) isort dogeaction
