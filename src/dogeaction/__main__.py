#!/usr/bin/env -S poetry run python
import os

from app import main

if __name__ == "__main__":
    print(os.getcwd())
    main()
