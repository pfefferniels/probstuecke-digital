const axios = require('axios'),
      APP_PATH = process.env.APP_PATH || 'db/apps/probstuecke-digital',
      HOST = process.env.BACKEND_HOST || '3.125.65.79',
      PORT = process.env.BACKEND_PORT || '8899',
      USER = process.env.BACKEND_USER,
      PASS = process.env.BACKEND_PASS;

async function retrieve(documentPath) {
  return axios({
    url: `http://${HOST}:${PORT}/exist/rest/${APP_PATH}/${documentPath}`,
    method: 'GET',
    auth: {
      username: USER,
      password: PASS
    }
  });
}

async function retrieveAsStream(documentPath) {
  return axios({
    url: `http://${HOST}:${PORT}/exist/rest/${APP_PATH}/${documentPath}`,
    method: 'GET',
    responseType: 'stream',
    auth: {
      username: USER,
      password: PASS
    }
  })
}

module.exports.retrieve = retrieve;
module.exports.retrieveAsStream = retrieveAsStream;
