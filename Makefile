PYTHON_BIN ?= poetry run

format: isort black

black:
	$(PYTHON_BIN) black ./dogeaction

isort:
	$(PYTHON_BIN) isort ./dogeaction

bin:
	$(PYTHON_BIN) pyinstaller --clean --onefile --name dogeaction --distpath bin __main__.py
	@cp bin/dogeaction ./dogeaction
	@chmod +x ./dogeaction
	@rm -rf bin build dogeaction.spec
