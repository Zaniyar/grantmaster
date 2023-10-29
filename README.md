# Grantmaster

## Prerequesites

- create a token (classic) with public_repo permissions at https://github.com/settings/tokens/new

## Run manually

1. copy the contents of `packages/crawler/.env-example` into the `packages/crawler/.env` file and add the variable values

2. run the following commands
    ```bash
    # step 1: install dependencies
    npm install

    # step 2: run mongo db using docker
    docker run -d --name mongo -p 27017:27017 mongo

    # step 3: start api
    npm run start:api

    # step 4: start frontend
    npm run start:frontend

    # step 5: access http://localhost:3000 in browser
    ```

## Run with Docker

### Use docker compose for orchestrating the services

This is the recommended way.
1. set the missing env variables in the docker-compose file
2. start all services using docker compose:
    ```bash
    # start db, api, frontend
    # (use -d to run containers in the background)
    $ docker compose up -d

    # display the containers
    # once everything is up and running, you can access the frontend on http://localhost:3000
    $ docker ps

    # tear down deployment
    $ docker compose down
    ```

### Manually build and run services

This is the more manual way, that gives you more control but less convenience when spinning up the infrastructure.

1. copy the contents of `packages/crawler/.env-example` into the `packages/crawler/.env` file and add the variable values
2. create network:
    ```bash
    $ docker network create grantmaster-network
    ```

3. build images manually:
    ```bash
    # build api image
    $ docker build -f Dockerfile-api -t grantmaster-api .

    # build frontend image
    $ docker build -f Dockerfile-frontend -t grantmaster-frontend .
    
    # check if images were built properly
    $ docker image ls
    REPOSITORY             TAG       IMAGE ID       CREATED         SIZE
    grantmaster-api        latest    9b77bb68f7fc   8 minutes ago   1.58GB
    grantmaster-frontend   latest    887003572229   8 minutes ago   1.58GB
    ```

4. run containers separately:
    ```bash
    $ docker run --network grantmaster-network -d --name mongo -p 27017:27017 mongo
    $ docker run --network grantmaster-network -d -p 3001:3001 grantmaster-api
    $ docker run --network grantmaster-network -d -p 3000:3000 grantmaster-frontend
    ```

## Known issues

**"directory not empty" error**

- problem: when installing npm dependencies, the following error occurs:
    ```bash
    $ npm ci
    npm ERR! code ENOTEMPTY
    npm ERR! syscall rename
    npm ERR! path /root/grant-master/packages/frontend/node_modules/istanbul-lib-instrument
    npm ERR! dest /root/grant-master/packages/frontend/node_modules/.istanbul-lib-instrument-J3DeZFqq
    npm ERR! errno -39
    npm ERR! ENOTEMPTY: directory not empty, rename '/root/grant-master/packages/frontend/node_modules/istanbul-lib-instrument' -> '/root/grant-master/packages/frontend/node_modules/.istanbul-lib-instrument-J3DeZFqq'

    npm ERR! A complete log of this run can be found in:
    npm ERR!     /root/.npm/_logs/2023-11-03T03_13_19_611Z-debug-0.log
    ```
- solution:
  1. run `find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +` to clean up the previously installed dependencies
  2. run `npm install` again
