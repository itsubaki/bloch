SHELL := /bin/bash

run:
	pnpm run dev

install:
	npm install -g pnpm
	pnpm install

update:
	pnpm update --latest
	pnpm add -D eslint@9.39.4
	pnpm audit

build:
	pnpm run build

test:
	pnpm run test:coverage

lint:
	pnpm exec eslint .
