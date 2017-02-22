# Commando

## Installation guide for Ubuntu 16.04.2 LTS 

#### Make sure the node version is > 7.6.0

```bash
node -v
> 7.6.0
```

#### Install PostgresSQL
If Postgres is not installed yet, follow these steps. If it is already installed, you should create a new db or use an existing one. 

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

#### Create postgres user
```bash
sudo -i -u postgres
createuser -P --interactive <name>
createdb commando
```

#### Install Redis
```bash
sudo apt-get update
sudo apt-get install redis-server
```

#### Install required libraries
```bash
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
```

#### Update node_modules
sudo is optional on this step but you may run into node-gyp rebuild error.
```bash
sudo npm i
```

#### Clone settings 
```bash
cp settings.json.example settings.json
```

After you clone the settings, edit them with your connection information. You'll also need to grab your bot token from the discord api page

```json
...
"token": "<token>",
"db":"postgres://<username>:<password>@localhost/commando"
...
```

#### Launch Commando
If there is a sequelize error, re-run the start command.
```bash
node Commando.js
```

If you run node with pm2
```bash
pm2 start Commando.js
```
