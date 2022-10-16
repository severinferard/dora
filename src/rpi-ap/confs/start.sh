#!/bin/sh

NOCOLOR='\033[0m'
RED='\033[0;31m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'

sigterm_handler () {
  echo -e "${CYAN}[*] Caught SIGTERM/SIGINT!${NOCOLOR}"
  pkill hostapd
  cleanup
  exit 0
}
cleanup () {
  echo -e "${CYAN}[*] Deleting iptables rules...${NOCOLOR}"
  sh /iptables_off.sh || echo -e "${RED}[-] Error deleting iptables rules${NOCOLOR}"
  echo -e "${CYAN}[*] Restarting network interface...${NOCOLOR}"
  ifdown wlan0
  ifup wlan0
  echo -e "${GREEN}[+] Successfully exited, byebye! ${NOCOLOR}"
}

trap 'sigterm_handler' TERM INT

echo -e "${CYAN}[*] Setting hostapd config${NOCOLOR}"
if [ $MODE == "wep" ]; then
  echo "Mode: WEP";
  mv /hostapd_confs/wep.conf /etc/hostapd/hostapd.conf
  sed -i s/SSID/$SSID/ /etc/hostapd/hostapd.conf
  sed -i s/WEP_KEY/$WEP_KEY/ /etc/hostapd/hostapd.conf
elif [ $MODE == "wpa2" ]; then
  echo "Mode: WPA2";
  cat /hostapd_confs/wpa2.conf
  mv /hostapd_confs/wpa2.conf /etc/hostapd/hostapd.conf
  sed -i s/SSID/$SSID/ /etc/hostapd/hostapd.conf
  sed -i s/WPA2_PASS/$WPA2_PASS/ /etc/hostapd/hostapd.conf
else
  echo "Mode: open";
   mv /hostapd_confs/open.conf /etc/hostapd/hostapd.conf
   sed -i s/SSID/$SSID/ /etc/hostapd/hostapd.conf
fi
cat /etc/hostapd/hostapd.conf 
echo -e "${CYAN}[*] Creating iptables rules${NOCOLOR}"
sh /iptables.sh || echo -e "${RED}[-] Error creating iptables rules${NOCOLOR}"

echo -e "${CYAN}[*] Setting wlan0 settings${NOCOLOR}"
ifdown wlan0
ifup wlan0

echo -e "${CYAN}[+] Configuration successful! Services will start now${NOCOLOR}"
dhcpd -4 -f -d wlan0 &
hostapd /etc/hostapd/hostapd.conf &
pid=$!
wait $pid

cleanup

