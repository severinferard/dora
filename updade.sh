echo 'updating dora'

cd /home/ubuntu
rm -rf dora
git clone https://github.com/severinferard/dora.git
cd dora/backend
npm install

echo 'Update done'
echo 'run `sudo systemctl restart dora` to apply changes'