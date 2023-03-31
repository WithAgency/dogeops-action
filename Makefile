PYTHON_BIN ?= poetry run

format: isort black

black:
	$(PYTHON_BIN) black dogeaction

isort:
	$(PYTHON_BIN) isort dogeaction

bin:
	rm -f doge
	$(PYTHON_BIN) pyinstaller --onefile --clean --noconfirm --name doge dogeaction/__main__.py
	cp dist/doge .
