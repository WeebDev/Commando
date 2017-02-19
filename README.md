# Commando

## HOW 2 INSTALL ON UBUNTU

#### MAKE SURE NODE VERSION > 7

```
node -v
> 7.5.0
```

#### INSTALL POSTGRES

```
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

#### ADD POSTGRES USER AND DATABASE

```
sudo -i -u postgres
createuser -P --interactive <name>
createdb commando
```

#### ADD REDIS FOR CACHE
```
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:chris-lea/redis-server
sudo apt-get update
sudo apt-get install redis-server
```

#### INSTALL SOME MOTHERFUCKING PACKAGES
```
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
```

#### GET NPM PACKAGES
```
sudo npm i
```

#### COMMENT OUT RAVEN
#### CLONE SETTINGS
```
cp settings.json.example settings.json
```

#### EDIT SETTINGS WITH YOUR INFO
```
postgres://<username>:<password>@localhost/commando
```

#### START COMMANDO
```
node --harmony Commando.js
```

#### JK YOU MIGHT HAVE TO RUN IT TWICE
```
node --harmony Commando.js
```

