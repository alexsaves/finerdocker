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
const loremIpsum = require('lorem-ipsum');

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
  description: 'How many average opportunities per day?',
  type: 'number',
  default: 2,
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
    host: pjson.config.db.host,
    user: pjson.config.db.user,
    password: pjson.config.db.pw
  };

  // Set up the connection pool
  const connectionPool = mysql.createPool(dbCluster);
  pjson.config.pool = connectionPool;

  // Start
  GenerateDataForAccount(pjson.config, result.email, result.days, result.oppsperday, result.respondents, result.salesorgsize).then((err, res) => {
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
const GenerateDataForAccount = async function (cfg, email, days, oppsperday, resps, salesorgsize) {
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
    await GenerateDataForOrg(cfg, org, days, oppsperday, resps, salesorgsize);
  }
};

/**
 * Create data for organization
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForOrg = async function (cfg, org, days, oppsperday, resps, salesorgsize) {
  console.log("Creating fixtures for (".yellow + org.name.magenta + ")...".yellow);
  console.log("Getting integrations...".yellow);
  const intrs = await org.getIntegrationsAsync(cfg);
  for (let i = 0; i < intrs.length; i++) {
    const intr = intrs[i];
    await GenerateDataForInt(cfg, org, intr, days, oppsperday, resps, salesorgsize);
  }
};

/**
 * Create data for integration
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForInt = async function (cfg, org, intr, days, oppsperday, resps, salesorgsize) {
  console.log("Creating fixtures for integration (".yellow + intr.crm_type.magenta + ")...".yellow);
  console.log("Clearing data for integration...".red);
  await intr.clearOpportunityDataAsync(cfg);
  console.log('Creating ('.yellow + salesorgsize.toString().magenta + ') CRM Users...'.yellow);
  const salesOrgList = [];
  for (let i = 0; i < salesorgsize; i++) {
    // Make the company
    const fname = faker.name.firstName();
    const lname = faker.name.lastName();
    const uemail = faker.internet.email();
    const crmUserInfo = {
      Id: shortid.generate().toUpperCase(),
      FirstName: fname,
      LastName: lname,
      Name: fname + ' ' + lname,
      Email: uemail,
      Username: uemail
    };
    const extraFields = [{
      name: 'integration_id',
      value: intr.uid
    },
    {
      name: 'Metadata',
      value: Buffer.from(JSON.stringify({}))
    }];
    salesOrgList.push(crmUserInfo);
    const cuser = await models.CRMUsers.CreateAsync(cfg, [crmUserInfo], extraFields);
  }
  console.log(`Generating opportunities (${days} days with ${oppsperday} per day with ${resps} respondents per opportunity)`.yellow);
  const hourincrements = (24 / oppsperday);
  // Start iterating over time
  const endDate = moment();
  const startDate = moment().subtract(days, 'days');
  const movingDate = startDate.clone();
  console.log(`Will make opportunities from ${startDate.format('LLLL')} to ${endDate.format('LLLL')}...`.yellow);
  while (movingDate.isBefore(endDate)) {
    movingDate.add(hourincrements, 'hours');
    await GenerateOpportunity(cfg, org, intr, movingDate.clone(), resps, salesOrgList);
  }
};

/**
 * Generate an opportunity
 * @param {*} cfg 
 * @param {*} org 
 * @param {*} intr 
 * @param {*} when 
 */
const GenerateOpportunity = async function (cfg, org, intr, when, resps, salesOrgUsers) {
  const salesPerson = salesOrgUsers[Math.floor(Math.random() * salesOrgUsers.length)];
  // Make the company
  const companyAccountInfo = {
    Id: shortid.generate().toUpperCase(),
    OwnerId: salesPerson.Id,
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
  // Create the propect (company) entry
  const cact = await models.CRMAccounts.CreateAsync(cfg, [companyAccountInfo], extraFields);

  // Create the opportunity entry
  const opportunityInfo = {
    Id: shortid.generate().toUpperCase(),
    AccountId: companyAccountInfo.Id,
    Amount: Math.round((Math.random() * 100000) + 10000),
    IsClosed: true,
    IsWon: false,
    OwnerId: salesPerson.Id,
    StageName: "Closed Lost",
    MetaData: Buffer.from(JSON.stringify({})),
    Name: companyAccountInfo.Name + " Opportunity",
    CloseDate: when.format("YYYY-MM-DD HH:mm:ss"),
    integration_id: intr.uid,
    approval_status: true
  };
  const oppExtraFields = [{
    name: 'integration_id',
    value: intr.uid
  }];
  const oppResult = await models.CRMOpportunities.CreateAsync(cfg, [opportunityInfo], oppExtraFields);
  await models.CRMOpportunities.setApprovalStatusOnIdAsync(cfg, true, opportunityInfo.Id);

  // Create the contacts for the opportunity and their opportunity roles
  const contactRoles = [
    "Executive Sponsor",
    "Economic Buyer",
    "Business User",
    "Economic Decision Maker"
  ];
  const oppContacts = [];
  for (let i = 0; i < resps; i++) {
    const fname = faker.name.firstName();
    const lname = faker.name.lastName();
    const uemail = faker.internet.email();
    const oppContact = {
      Id: shortid.generate().toUpperCase(),
      OwnerId: salesPerson.Id,
      FirstName: fname,
      LastName: lname,
      Title: faker.name.jobTitle(),
      Email: uemail,
      MetaData: Buffer.from(JSON.stringify({})),
      Name: fname + ' ' + lname,
      integration_id: intr.uid
    };
    oppContacts.push(oppContact);
    const contactResult = await models.CRMContacts.CreateAsync(cfg, [oppContact], oppExtraFields);
    const oppRole = {
      ContactId: oppContact.Id,
      Id: shortid.generate().toUpperCase(),
      IsPrimary: (i === 0) ? 1 : 0,
      OpportunityId: opportunityInfo.Id,
      Role: contactRoles[Math.floor(Math.random() * contactRoles.length)]
    };
    oppContact.role = oppRole;
    const roleResult = await models.CRMOpportunityRoles.CreateAsync(cfg, [oppRole], oppExtraFields);
  }

  // Create the survey (one for salesperson and one for contacts)
  const employeeSv = await models.Survey.CreateAsync(cfg, {
    organization_id: org.id,
    survey_type: models.Survey.SURVEY_TYPES.EMPLOYEE,
    survey_model: Buffer.from(JSON.stringify(models.Survey.getSurveyFixture(models.Survey.SURVEY_TYPES.EMPLOYEE))),
    name: companyAccountInfo.Name + " Feedback",
    is_active: 1,
    opportunity_id: opportunityInfo.Id,
    created_at: when.toDate(),
    updated_at: when.toDate()
  });
  const contactSv = await models.Survey.CreateAsync(cfg, {
    organization_id: org.id,
    survey_type: models.Survey.SURVEY_TYPES.PROSPECT,
    survey_model: Buffer.from(JSON.stringify(models.Survey.getSurveyFixture(models.Survey.SURVEY_TYPES.PROSPECT))),
    name: companyAccountInfo.Name + " Feedback",
    is_active: 1,
    opportunity_id: opportunityInfo.Id,
    created_at: when.toDate(),
    updated_at: when.toDate()
  });

  // Decide the general characteristics of the salesperson's response
  const salesPersonModel = GenerateSurveyResponseModel();
  console.log(JSON.stringify(salesPersonModel));

  // Decide the general characteristics of the contacts responses

  // Input the responses
};

/**
 * Make a response model
 */
const GenerateSurveyResponseModel = function () {
  const resultModel = {};
  const mainReasonsNotChosen = [
    0,
    1,
    2,
    3,
    4,
    5,
    9999
  ];
  resultModel.answers = {
    buyXRating: Math.floor(Math.random() * 7) + 1,
    whyNotSelected: {
      responses: [mainReasonsNotChosen.splice(Math.floor(Math.random() * mainReasonsNotChosen.length), 1)[0], mainReasonsNotChosen.splice(Math.floor(Math.random() * mainReasonsNotChosen.length), 1)[0]],
      other: ""
    }
  };

  if (resultModel.answers.whyNotSelected.responses.indexOf(9999) > -1) {
    resultModel.answers.whyNotSelected.other = loremIpsum({ count: 3, units: 'words' });
  }

  return resultModel;
};