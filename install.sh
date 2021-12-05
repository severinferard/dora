##!/bin/sh
##
## This script installs everything to run the DORA project server.
##
## THIS SCRIPT MUST BE LAUCHED WITH ROOT PRIVILEGES
## THIS SCRIPT HAS ONLY BEEN TESTED WITH UBUNTU Server 20.04 LTS
## Will be installed:
##	- The wifi-ap snap pack to create a wifi access point
##	- Mongodbd (server)
##	- NodeJS and NPM
##	_ The DORA project sources
##
##
## DISCLAIMER: THIS SERVER IS NOT SECURE. THIS SCRIPT WILL OPEN PORT ON
## YOUR MACHINE AND THE DATABASE IS OPENED TO THE OUTSIDE WORLD.
## CONNECT THE MACHINE TO THE INTERNET AT YOUR OWN RISKS.
## 

# Wifi settings
WIFI_SSID=Movuino							# <--- MODIFY THOSE
WIFI_PASSPHRASE=Movuino2021
WIFI_SERVER_STATIC_IP=10.0.60.1

# Stop and disable Ubuntu auto software updates
systemctl stop apt-daily.timer
systemctl disable apt-daily.timer
systemctl disable apt-daily.service
systemctl daemon-reload

sleep 1
# Install and configure wifi-ap
apt install snapd											# A reboot may be needed here
sleep 1
snap install wifi-ap
sleep 1
wifi-ap.config set wifi.ssid=$WIFI_SSID
wifi-ap.config set wifi.security-passphrase=$WIFI_PASSPHRASE
wifi-ap.config set wifi.address=$WIFI_SERVER_STATIC_IP
wifi-ap.config set wifi.security=wpa2
wifi-ap.config set disabled=false

# Install Mongodbd
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
sleep 1
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
apt-get update
apt-get install -y mongodb-org
sleep 1
iptables -A INPUT -p tcp --dport 27017 -j ACCEPT
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/g' /etc/mongod.conf
systemctl start mongod
systemctl enable mongod

# Create Database and Collections
echo "use doraDB" | mongo
mongo doraDB --eval 'db.createCollection("sessions")'
mongo doraDB --eval 'db.createCollection("schools")'

# Install NodeJS and NPM
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt install nodejs

# Get the DORA project Sources
git clone https://github.com/severinferard/orienteering-race-project.git /home/ubuntu/orienteering-race-project

# Install DORA dependencies
apt install -y make build-essential
cd /home/ubuntu/dora/backend
npm install

# Create a service to start the DORA server on boot
echo "
[Unit]
Description=DORA project nodejs server
Documentation=https://github.com/severinferard/dora
After=network.target

[Service]
Environment=PORT=80 NODE_ENV=production
#Type=simple
User=root
ExecStart=/usr/bin/node /home/ubuntu/dora/backend/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dora

[Install]
WantedBy=multi-user.target
" | tee /lib/systemd/system/dora.service
systemctl enable dora.service

# Add a custom host name so that "dora" will resolve to the server ip address
echo "$WIFI_SERVER_STATIC_IP dora" | tee -a /etc/hosts

# sudo networksetup -createnetworkservice Loopback lo0
# sudo networksetup -setmanual Loopback 172.20.42.42 255.255.255.255