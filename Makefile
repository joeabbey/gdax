all: index.js Dockerfile
	docker build -t gdax .
	docker run -t gdax 
