var fs = require('fs');
var creds = JSON.parse(fs.readFileSync('credentials_login.json', 'utf8'));

const config = {
  client: {
    id: creds.client_id,
    secret: creds.client_secret
  },
  auth: {
    tokenHost: creds.api_base_url,
  }
};
// TODO: DRY
const port = 8888;
const callbackUrl = 'http://thirdparty:8888/authorized';
const axios = require("axios");

const { ClientCredentials, ResourceOwnerPassword, AuthorizationCode } = require('simple-oauth2');
const app = require('express')();

const client = new AuthorizationCode(
  config
);

// Authorization uri definition
const authorizationUri = client.authorizeURL({
  redirect_uri: callbackUrl,
  scope: 'profile',
});

// Initial page redirecting to Github
app.get('/auth', (req, res) => {
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
app.get('/authorized', async (req, res) => {
  const { code } = req.query;
  const options = {
    code,
    redirect_uri: callbackUrl,
  };
  var accessToken;
  try {
    accessToken = await client.getToken(options);
    console.log('The resulting token: ', accessToken.token);
  } catch (error) {
    console.error('Access Token Error', error.message);
    return res.status(500).json('Authentication failed');
  }
  var profile_data;
  try {
    // const profile_data = await accessToken.get('profile');
    const token = accessToken.token.access_token;
    const profile_response =  await axios ({
      method: 'get',
      url: `${creds.api_base_url}/profile`,
      headers: {
          'Authorization': `Bearer ${token}`
      }
    });
    profile_data = profile_response.data;
    console.log('The resulting profile: ', profile_data);
  } catch (error) {
    console.error('Profile request error', error.message);
    return res.status(500).json(error);
  }
  return res.status(200).json({'accessToken': accessToken.token,
                               'profile': profile_data
                              });
});

app.get('/', (req, res) => {
  res.send('Hello<br><a href="/auth">Log in with Aerpass</a>');
});


app.listen(port, (err) => {
  if (err) return console.error(err);
  console.log(`Express server listening at http://thirdparty:${port}`);
  });
