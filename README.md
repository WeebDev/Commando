# Commando
> Commando Discord bot built on discord.js-commando.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Run it yourself

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

#### Get ready
```bash
wget https://raw.githubusercontent.com/WeebDev/Commando/master/docker-compose.yml.example -O docker-compose.yml
```

***Fill out all the needed ENV variables.***

#### Launch docker-compose

```bash
docker-compose up -d
```

## Author

**Commando** © [WeebDev](https://github.com/WeebDev), Released under the [MIT](https://github.com/WeebDev/Commando/blob/master/LICENSE) License.<br>
Authored and maintained by WeebDev.

> GitHub [@WeebDev](https://github.com/WeebDev)
