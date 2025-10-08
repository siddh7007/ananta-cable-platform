.PHONY: build run test clean

build:
	docker build -t rules-service .

run:
	docker run -p 8000:8000 rules-service

test:
	pytest -v

dev:
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

install:
	pip install -r requirements.txt