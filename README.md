# Third Party Web Tools
Create requests for:
* authentication
* transaction

## How to run
* Install virtualenv and requirements.txt

```bash
sudo yum install python3 -y
pip3 install --user virtualenv
virtualenv thirdparty_virtenv
. thirdparty_virtenv/bin/activate
pip install -r requirements.txt
```
* Change dev_env.sh to represent how the service is to run

* 'python service.py'

## How to test
* Enable thirdparty virtual environment
* source ../../aws_deploy/dev_env.sh
* Create credentials for local dev account with aws_deploy/onboard_dev_partner.py
* cp ../../aws_deploy/credentials_dev_partner.json .
* python service.py

## How to deploy
* Copy web/thirdparty directory to server of choice
* Install virtualenv as shown above
* Set environment variables for deployment - examples in aws_deploy
* python service.py

## Node instructions
* Install dependencies
```bash
npm install express simple-oauth2 axios
```
* Start server
```bash
node service.js
```
