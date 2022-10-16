# dora

## Prerequisites
### Mac
Dora uses docker compose in order to be run on a wide variety of devices. Docker Desktop for Mac can be downloaded [here](https://docs.docker.com/desktop/install/mac-install/).
If Dora is intended to be used offline on the field, you will also have to provide your own wifi hotspot.

### Raspberry Pi
1. Install a fresh copy of RaspberryPi OS 64 bit lite on the Raspberry Pi SD card. We recommmand the use of the Raspberry Pi Imager software ([download here](https://www.raspberrypi.com/software/)) which allow to preconfigure the setup wifi and ssh creds.

**IMPORTANT**: The Raspberry Pi image MUST be of a 64 bit architecture !

2. Boot up the Raspberry Pi with the freshly flashed SD card and connect to it via SSH.

3. Install docker and docker compose
```bash
sudo apt update && sudo apt upgrade -y && curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo usermod -aG docker pi
```

4. Install git 
```bash
sudo apt install -y git
```

5. Clone the repo
```bash
cd /home/pi && git clone https://github.com/severinferard/dora.git
```

5. The openstreetmap tile server image doesn't support the arm64 architecture so we have to rebuild it on our system.
```bash
cd /home/pi && git clone https://github.com/Overv/openstreetmap-tile-server.git && cd openstreetmap-tile-server.git && docker build . -t osm/arm64
```
We also have to modify the image in the `docker-compose.yml` file.
In `docker-compose.yml`replace `overv/openstreetmap-tile-server:latest` by `osm/arm64`


## How to run

### Import OpenStreetMap location
```bash
docker run \
    -e DOWNLOAD_PBF=https://download.geofabrik.de/europe/france/ile-de-france-latest.osm.pbf\
    -v osm-data:/data/database/ -v osm-tiles:/data/tiles/ \
    overv/openstreetmap-tile-server \
    import
```
On Raspberry Pi, replace `overv/openstreetmap-tile-server` with your rebuilt image like `osm/arm64`.

Import can take between a few minutes and a few hours. PBF urls can be found [here](https://download.geofabrik.de/europe/france.html).

### Run Dora
```bash
docker compose up
```
