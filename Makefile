all: run

run: build
	docker run -it gdax

build: index.js config.js Dockerfile
	docker build -t gdax .
