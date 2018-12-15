const pjson = require('./package.json');
const mysql = require('mysql');
const finercommon = require('finercommon');
const TestFixtureGenerator = finercommon.TestFixtureGenerator;
const prompt = require('prompt');

console.log("FinerInk Fixture Creator");
//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: username and email
//
prompt.get([{
  name: 'environment',
  description: 'Which Environment? 0 = local, 1 = prod',
  type: 'number',
  default: 0,
  required: true
}, {
  name: 'email',
  description: 'What is the email address of the account?',
  type: 'string',
  default: 'alexei.white@gmail.com',
  required: true
},
{
  name: 'days',
  description: 'How many days of opportunities to create?',
  type: 'number',
  default: 30,
  required: true
},
{
  name: 'oppsperday',
  description: 'How many maximum opportunities per day?',
  type: 'number',
  default: 3,
  required: true
},
{
  name: 'salesorgsize',
  description: 'How big is your sales organization?',
  type: 'number',
  default: 10,
  required: true
},
{
  name: 'respondents',
  description: 'How many respondents per opportunity?',
  type: 'number',
  default: 3,
  required: true
}], function (err, result) {
  var dbVars = pjson.config.db;
  // Do the env
  if (result.environment === 1) {
    dbVars = pjson.config.dbProd;
  }

  const dbCluster = {
    connectionLimit: 5,
    host: dbVars.host,
    user: dbVars.user,
    password: dbVars.pw
  };

  // Set up the connection pool
  const connectionPool = mysql.createPool(dbCluster);
  pjson.config.pool = connectionPool;

  // Go
  TestFixtureGenerator.GenerateDataForAccount(pjson.config, result.email, result.days, result.oppsperday, result.respondents, result.salesorgsize, function(msg) {
    console.log("[" + (new Date()) + "]", msg);
  }).then((err, res) => {
    console.log("Done!");
    process.exit(1);
  }).catch((e) => {
    console.log("ERROR".red);
    console.log(e);
    throw e;
  });
});
