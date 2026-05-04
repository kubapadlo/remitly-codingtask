#!/bin/bash
PORT=${1:-8080}
PORT=$PORT docker-compose up --build -d