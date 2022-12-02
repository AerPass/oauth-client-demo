"""Example third party web site
* Authenticate using AerPass OAuth2
* Transaction using AerPass OAuth2
"""
from flask import abort, Flask, jsonify, redirect, render_template, request, session, url_for, send_from_directory
from authlib.integrations.flask_client import OAuth
import json
import logging
import os

from dotenv import load_dotenv
load_dotenv()  # load environment variables from .env

with open('credentials_dev_partner.json', 'r') as credentials_file:
    credentials = json.load(credentials_file)
logging.basicConfig(level=logging.DEBUG)
app = Flask(__name__)
app.secret_key = os.urandom(24)


def fetch_token(name):
    app.logger.info("Fetch token name %s", name)
    token = session['dev_token']
    return dict(
            access_token=token['access_token'],
            token_type=token['token_type'],
            # refresh_token=token['refresh_token'],
            expires_at=token['expires_at'],
        )


app.debug = True
oauth = OAuth(app, fetch_token=fetch_token)

aerpass = oauth.register(
    'AerPass',
    **credentials
)


@app.route('/')
def index():
    """Login page or purchase page
    """
    app.logger.info("Session is %s", session)
    if 'dev_token' in session:
        profile_response = aerpass.get('profile', request=request)
        profile = profile_response.json()
        app.logger.info("index: token profile response is %s", profile)
        return render_template('purchase.html', profile=profile)
    else:
        return render_template('index.html')


@app.route('/login')
def login():
    redirect_uri = url_for('authorized', _external=True)
    return aerpass.authorize_redirect(redirect_uri)


@app.route('/logout')
def logout():
    session.pop('authenticated', None)
    session.pop('auth_id', None)
    session.pop('dev_token', None)
    return redirect(url_for('index'))


@app.route('/authorized')
def authorized():
    token = aerpass.authorize_access_token()
    if token is None:
        return 'Access denied: error=%s' % (
            request.args['error']
        )
    if isinstance(token, dict) and 'access_token' in token:
        app.logger.debug("Got access token %s", token['access_token'])
        session['dev_token'] = token
        app.logger.debug("Rest of stuff %s", token)
        return redirect(url_for('index'))
    return str(token)


@app.route('/client')
def client_method():
    app.logger.debug("/client access token %s", session['dev_token'])
    ret = aerpass.get("client")
    if ret.status not in (200, 201):
        return abort(ret.status)
    return ret.raw_data


@app.route('/email')
def email_method():
    ret = aerpass.get("email")
    app.logger.debug("/email ret status is %s", ret.status)
    if ret.status not in (200, 201):
        return abort(ret.status)
    return ret.raw_data


@app.route('/method/<name>')
def method(name):
    app.logger.debug("/method/%s", name)
    func = getattr(aerpass, name)
    ret = func('method')
    return ret.raw_data


@app.route('/transaction', methods=['POST'])
def post_transaction():
    """Request new transaction from partner web service

    Form Params:
        amount - Amount of transaction

    Returns JSON:
        data: request_id - String to identify this authentication request
    """
    if 'dev_token' not in session:
        app.logger.info("Not authenticated in session")
        result = {'data': {'error': 'Not authenticated in session'}}
    app.logger.info("Requesting new transaction request_id with amount %s", request.form['amount'])
    req_dict = {"action": "purchase", "amount": request.form['amount']}
    app.logger.info("Posting transaction %s", req_dict)
    r = aerpass.post('transaction', json=req_dict)
    result = r.json()
    app.logger.info("Got %s", result)
    session['request_id'] = result['request_id']
    return result


@app.route('/transaction', methods=['GET'])
def get_transaction():
    """Get transaction status

    Returns JSON:
        data: status of the transaction process
    """
    result = None
    if 'request_id' not in session:
        app.logger.info("No transaction in process")
        result = {'data': {'error': 'No transaction in process'}}
    else:
        app.logger.info("Checking transaction %s", session['request_id'])
        r = aerpass.get("transaction/%s" % session["request_id"])
        result = r.json()
        app.logger.info("Got %s", result)
    return jsonify(result)


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


if __name__ == '__main__':
    '''Start tornado listener for flask app
    '''
    from tornado.wsgi import WSGIContainer
    from tornado.httpserver import HTTPServer
    from tornado.ioloop import IOLoop
    # So that self-signed certs can work in dev env.  This MUST be removed for
    # production
    import ssl
    ssl._create_default_https_context = ssl._create_unverified_context
    # logging.basicConfig(level=logging.DEBUG)
    http_server = HTTPServer(WSGIContainer(app))
    http_server.listen(int(os.environ["THIRDPARTY_PORT"]))
    IOLoop.instance().start()
