IMGNAME = dora
VERSION = 0.1
DOCKER_COMPOSE_MAC = docker-compose-mac.yml
DOCKER_COMPOSE_LINUX = docker-compose-rpi.yml
OSM_IMG_PREBUILT = overv/openstreetmap-tile-server
OSM_DOCKERFILE = ./src/openstreetmap-tile-server
OSM_IMG_REBUILT = osm/rebuilt

UNAME := $(shell uname)

deploy:
ifeq ($(UNAME), Darwin)
	@echo "Deploying DORA on Mac OS"
	docker compose -f $(DOCKER_COMPOSE_MAC) up
endif
ifeq ($(UNAME), Linux)
	@echo "Deploying DORA on Linux"
	docker compose -f $(DOCKER_COMPOSE_LINUX) up
endif

build-osm:
	docker build $(OSM_DOCKERFILE) -t $(OSM_IMG_REBUILT)

import-map:
	@echo Importing map data from $(DOWNLOAD_PBF)
ifeq ($(UNAME), Darwin)
	$(MAKE) build-osm
	docker run -e DOWNLOAD_PBF=$(DOWNLOAD_PBF) -v osm-data:/data/database/ -v osm-tiles:/data/tiles/ $(OSM_IMG_PREBUILT) import 
endif
ifeq ($(UNAME), Linux)
	$(MAKE) build-osm
	docker run -e DOWNLOAD_PBF=$(DOWNLOAD_PBF) -v osm-data:/data/database/ -v osm-tiles:/data/tiles/ $(OSM_IMG_REBUILT) import 
endif



