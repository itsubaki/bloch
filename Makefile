SHELL := /bin/bash

run:
	pnpm run dev

install:
	npm install -g pnpm
	pnpm install

build:
	pnpm run build

test:
	pnpm run test:coverage

lint:
	pnpm exec eslint .
