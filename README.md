# Commando

## Installation guide for Ubuntu 16.04.2 LTS

#### Install Docker

```bash
sudo apt-get update
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
sudo apt-add-repository 'deb https://apt.dockerproject.org/repo ubuntu-xenial main'
sudo apt-get update
sudo apt-get install -y docker-engine
```

#### Install docker-compose
```bash
sudo pip install docker-compose
```

#### Clone settings
```bash
cp docker-compose.yml.example docker-compose.yml
```

Fill out all the needed ENV variables.

#### Launch docker-compose
Make sure docker.sh is executeable.

```bash
docker.sh
```
