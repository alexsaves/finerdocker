const pjson = require('./package.json');
const mysql = require('mysql');
const finercommon = require('finercommon');
const models = finercommon.models;
const colors = require('colors');
const md5 = require('md5');
const prompt = require('prompt');
const moment = require('moment');
const faker = require('faker');
const shortid = require('shortid');

console.log("FinerInk Fixture Creator".yellow);
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
},{
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
  description: 'How many opportunities per day?',
  type: 'number',
  default: 2,
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
    host: pjson.config.db.host,
    user: pjson.config.db.user,
    password: pjson.config.db.pw
  };

  // Set up the connection pool
  const connectionPool = mysql.createPool(dbCluster);
  pjson.config.pool = connectionPool;

  // Start
  GenerateDataForAccount(pjson.config, result.email, result.days, result.oppsperday, result.respondents).then((err, res) => {
    console.log("Done!");
    process.exit(1);
  }).catch((e) => {
    console.log("ERROR".red);
    console.log(e);
    throw e;
  });
});

/**
 * Generate Data
 * @param {ConnectionPool} pool 
 * @param {String} email 
 */
const GenerateDataForAccount = async function(cfg, email, days, oppsperday, resps) {
  console.log("\nLocating account (".yellow + email.magenta + ")...".yellow);
  const account = await models.Account.GetByEmailAsync(cfg, email);
  if (!account) {
    throw new Error("Account not found!");
  }
  console.log("Enforcing account is active...".yellow);
  account.is_active = 1;
  await account.commitAsync(cfg);
  console.log("Getting orgs...".yellow);
  const orgs = await account.getOrganizationsAsync(cfg);
  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    await GenerateDataForOrg(cfg, org, days, oppsperday, resps);
  }
};

/**
 * Create data for organization
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForOrg = async function(cfg, org, days, oppsperday, resps) {
  console.log("Creating fixtures for (".yellow + org.name.magenta + ")...".yellow);
  console.log("Getting integrations...".yellow);
  const intrs = await org.getIntegrationsAsync(cfg);
  for (let i = 0; i < intrs.length; i++) {
    const intr = intrs[i];
    await GenerateDataForInt(cfg, org, intr, days, oppsperday, resps);
  }
};

/**
 * Create data for integration
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForInt = async function(cfg, org, intr, days, oppsperday, resps) {
  console.log("Creating fixtures for integration (".yellow + intr.crm_type.magenta + ")...".yellow);
  console.log("Clearing data for integration...".red);
  await intr.clearOpportunityDataAsync(cfg);
  console.log(`Generating opportunities (${days} days with ${oppsperday} per day with ${resps} respondents per opportunity)`.yellow);
  const hourincrements = (24 / oppsperday);
  // Start iterating over time
  const endDate = moment();
  const startDate = moment().subtract(days, 'days');
  const movingDate = startDate.clone();
  console.log(`Will make opportunities from ${startDate.format('LLLL')} to ${endDate.format('LLLL')}...`.yellow);
  while (movingDate.isBefore(endDate)) {
    movingDate.add(hourincrements, 'hours');
    await GenerateOpportunity(cfg, org, intr, movingDate.clone(), resps);
  }
};

/**
 * Generate an opportunity
 * @param {*} cfg 
 * @param {*} org 
 * @param {*} intr 
 * @param {*} when 
 */
const GenerateOpportunity = async function(cfg, org, intr, when, resps) {
  // Make the company
  const companyAccountInfo = {
    Id: shortid.generate().toUpperCase(),
    OwnerId: shortid.generate().toUpperCase(),
    Name: faker.company.companyName()
  };
  const extraFields = [{
    name: 'integration_id',
    value: intr.uid
  },
  {
    name: 'Metadata',
    value: Buffer.from(JSON.stringify({}))
  }];
  const cact = await models.CRMAccounts.CreateAsync(cfg, [companyAccountInfo], extraFields);
  
};