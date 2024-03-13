install:
	rm -rf yarn.lock node_modules
	git pull
	yarn
	yarn build
	pm2 start "yarn start" --name fe

build:
	rm -rf yarn.lock
	git pull
	yarn
	yarn build
	pm2 restart fe