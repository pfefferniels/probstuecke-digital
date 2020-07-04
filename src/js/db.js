const axios = require('axios'),
      existConfig = require('../../existConfig.json'),
      APP_PATH = 'db/apps/probstuecke-digital';

async function retrieve(documentPath) {
  return axios({
    url: `http://${existConfig.host}:${existConfig.port}/exist/rest/${APP_PATH}/${documentPath}`,
    method: 'GET',
    auth: {
      username: existConfig.basic_auth.user,
      password: existConfig.basic_auth.pass
    }
  });
}

async function retrieveAsStream(documentPath) {
  return axios({
    url: `http://${existConfig.host}:${existConfig.port}/exist/rest/${APP_PATH}/${documentPath}`,
    method: 'GET',
    responseType: 'stream',
    auth: {
      username: existConfig.basic_auth.user,
      password: existConfig.basic_auth.pass
    }
  });
}

module.exports.retrieve = retrieve;
module.exports.retrieveAsStream = retrieveAsStream;
