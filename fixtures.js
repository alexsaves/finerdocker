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
    await GenerateDataForOrg(cfg, account, org, days, oppsperday, resps, salesorgsize);
  }
};

/**
 * Create data for organization
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForOrg = async function (cfg, account, org, days, oppsperday, resps, salesorgsize) {
  console.log("Creating fixtures for (".yellow + org.name.magenta + ")...".yellow);
  console.log("Getting integrations...".yellow);
  const intrs = await org.getIntegrationsAsync(cfg);
  for (let i = 0; i < intrs.length; i++) {
    const intr = intrs[i];
    await GenerateDataForInt(cfg, account, org, intr, days, oppsperday, resps, salesorgsize);
  }
};

/**
 * Create data for integration
 * @param {Config} cfg 
 * @param {Organization} org 
 */
const GenerateDataForInt = async function (cfg, account, org, intr, days, oppsperday, resps, salesorgsize) {
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
    await GenerateOpportunity(cfg, account, org, intr, movingDate.clone(), resps, salesOrgList);
  }
};

/**
 * Generate an opportunity
 * @param {*} cfg 
 * @param {*} org 
 * @param {*} intr 
 * @param {*} when 
 */
const GenerateOpportunity = async function (cfg, account, org, intr, when, resps, salesOrgUsers) {
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
  await GenerateRespondent(cfg, when, account, org, companyAccountInfo, salesPerson, null, true, employeeSv, org.feature_list, org.competitor_list, oppContacts);
  
  // Decide the general characteristics of the contacts responses

  // Input the responses
};

const GenerateRespondent = async function(cfg, when, account, org, companyAccountInfo, salesPerson, contact, isSalesperson, sv, featureList, competitorList, oppContacts) {
  // Make the approval entry
  const apr = await models.Approval.CreateAsync(cfg, {
    sendEmail: 1,
    sendState: models.Approval.SEND_STATES.SENT,
    created_at: when.toDate(),
    updated_at: when.toDate(),
    created_by_account_id: account.id,
    organization_id: org.id,
    crm_contact_id: !isSalesperson ? contact.Id: null,
    crm_user_id: isSalesperson ? salesPerson.Id : null,
    survey_guid: sv.guid
  });

  // Get the survey response
  const respModel = GenerateSurveyResponseModel(org.feature_list, org.competitor_list, oppContacts);

  // Set the variables
  const respVars = {
    companyName : org.name,
    prospectName : companyAccountInfo.Name,
    surveyTheme : org.default_survey_template,
    surveyTitle : org.name + " Feedback",
    decisionMakerList : ""
  };

  for (let i = 0; i < org.competitor_list.length; i++) {
    respVars["competitor" + (i + 1)] = org.competitor_list[i];
  }

  for (let i = 0; i < org.feature_list.length; i++) {
    respVars["feature" + (i + 1)] = org.feature_list[i];
  }

  for (let i = 0; i < oppContacts.length; i++) {
    respVars["decisionMaker" + (i + 1)] = oppContacts[i].Name + ", " + oppContacts[i].Title;
    if (i > 0) {
      respVars.decisionMakerList += ", ";
    }
    respVars.decisionMakerList += oppContacts[i].Name;    
  }

  // Create the respondent
  const respEntry = await models.Respondent.CreateAsync(cfg, {
    created_at: when.toDate(),
    updated_at: when.toDate(),
    survey_guid: sv.guid,
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
    ip_addr: "::1",
    time_zone: 480,
    is_active: 1,
    approval_guid: apr.guid,
    variables: respVars,
    answers: respModel
  });

  // Apply the answers
  await respEntry.applyAnswersForSurveyAsync(cfg, sv, {answers: respModel});
};

/**
 * Make a response model
 */
const GenerateSurveyResponseModel = function (featureList, competitorList, oppContacts) {
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

  // Did they pick "other"
  if (resultModel.answers.whyNotSelected.responses.indexOf(9999) > -1) {
    resultModel.answers.whyNotSelected.other = loremIpsum({ count: 3, units: 'words' });
  }

  // Did they pick "price"
  if (resultModel.answers.whyNotSelected.responses.indexOf(0) > -1) {
    const priceOptions = [
      0,
      1,
      2,
      3
    ];
    resultModel.answers.pricingModel = priceOptions[Math.floor(Math.random() * priceOptions.length)];
    switch (resultModel.answers.pricingModel) {
      case 0:
        resultModel.answers.flatFeeAmountDetails = Math.round(Math.random() * 25000) + 1000;
        break;
      case 1:
        resultModel.answers.annualSubscriptionDetails = Math.round(Math.random() * 25000) + 1000;
        break;
      case 2:
        resultModel.answers.percentageRateDetails = loremIpsum({ count: 10, units: 'words' });
        break;
      case 3:
        resultModel.answers.pricePerVolumeDetails = loremIpsum({ count: 10, units: 'words' });
        break;
    }
  }

  // They picked product and service features
  if (resultModel.answers.whyNotSelected.responses.indexOf(1) > -1) {
    const missingFeatureOpts = [
      0,
      1,
      2,
      3,
      4,
      9999
    ];
    resultModel.answers.missingFeature = {
      response: missingFeatureOpts[Math.floor(Math.random() * missingFeatureOpts.length)],
      other: ""
    };
    // Fill the other
    if (resultModel.answers.missingFeature.response == 9999) {
      resultModel.answers.missingFeature.other = loremIpsum({ count: 3, units: 'words' });
    }
  }

  // They picked does not meet our business needs
  if (resultModel.answers.whyNotSelected.responses.indexOf(2) > -1) {
    resultModel.answers.valueReasons = loremIpsum({ count: 10, units: 'words' });
  }

  // They picked timeliness of delivery
  if (resultModel.answers.whyNotSelected.responses.indexOf(3) > -1) {
    const deliveryTimelinessOpts = [
      0,
      1,
      2,
      3,
      4,
      5
    ];
    resultModel.answers.desiredTimeline = {};
    resultModel.answers.desiredTimeline.response = deliveryTimelinessOpts[Math.floor(Math.random() * deliveryTimelinessOpts.length)];
  }

  // They picked customer service
  if (resultModel.answers.whyNotSelected.responses.indexOf(4) > -1) {
    resultModel.answers.serviceReasons = loremIpsum({ count: 10, units: 'words' });
  }

  // They picked external factors
  if (resultModel.answers.whyNotSelected.responses.indexOf(5) > -1) {
    const extReasonsWhyNotOpts = [
      0,
      1,
      2,
      9999
    ];
    resultModel.answers.externalReasonsWhyNot = {
      response: extReasonsWhyNotOpts[Math.floor(Math.random() * extReasonsWhyNotOpts.length)],
      other: ""
    };
    // Fill the other
    if (resultModel.answers.externalReasonsWhyNot.response == 9999) {
      resultModel.answers.externalReasonsWhyNot.other = loremIpsum({ count: 3, units: 'words' });
    }
  }

  // External vendor criteria
  const extVendorCrit = [
    0,
    1,
    2,
    3,
    4,
    5,
    9999
  ];
  resultModel.answers.mostImportantVendorCriteria = {order: [], other: ""};
  while (extVendorCrit.length > 0) {
    resultModel.answers.mostImportantVendorCriteria.order.push(extVendorCrit.splice(Math.floor(Math.random() * extVendorCrit.length), 1)[0]);
  }
  // if "other" is high
  if (resultModel.answers.mostImportantVendorCriteria.order.indexOf(9999) < 3) {
    resultModel.answers.mostImportantVendorCriteria.other = loremIpsum({ count: 3, units: 'words' });
  }

  // How well did the vendor do in each area
  resultModel.answers.howWellInAreas = [
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1
  ];

  // Handle frequency and responsiveness
  resultModel.answers.frequencyRating = Math.random() * 100;
  resultModel.answers.responsivenessRating = Math.random() * 100;

  // Competitor ranking
  const competitorQPossibleAnswers = [];
  for (let i = 0; i < competitorList.length + 2; i++) {
    competitorQPossibleAnswers.push(i);
  }
  competitorQPossibleAnswers.push(9999);
  resultModel.answers.vendorRankings = {order: [], other: ""};
  while (competitorQPossibleAnswers.length > 0) {
    resultModel.answers.vendorRankings.order.push(competitorQPossibleAnswers.splice(Math.floor(Math.random() * competitorQPossibleAnswers.length), 1)[0]);
  }
  // if "other" is high
  if (resultModel.answers.vendorRankings.order.indexOf(9999) < 3) {
    resultModel.answers.vendorRankings.other = faker.company.companyName(); // Company name
  }

  // Reasons why winner was chosen
  const winnerChosenOpts = [
    0,
    1,
    2,
    3,
    4,
    5,
    9999
  ];
  resultModel.answers.reasonsWhyWinnerChosen = {
    responses: [winnerChosenOpts.splice(Math.floor(Math.random() * winnerChosenOpts.length), 1)[0], winnerChosenOpts.splice(Math.floor(Math.random() * winnerChosenOpts.length), 1)[0]],
    other: ""
  };
  // Fill the other
  if (resultModel.answers.reasonsWhyWinnerChosen.responses.indexOf(9999) < 3) {
    resultModel.answers.reasonsWhyWinnerChosen.other = loremIpsum({ count: 3, units: 'words' });
  }

  // Compared to your ideal vendor
  resultModel.answers.rateWinningVendor = [
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1,
    Math.floor(Math.random() * 7) + 1
  ];

  // Add a major player
  resultModel.answers.majorPlayersList = [
    faker.name.firstName() + " " + faker.name.lastName() + ", " + faker.name.jobTitle(),
    "",
    "",
    ""
  ];

  // Handle the ratings for the contacts
  for (let i = 0; i < oppContacts.length; i++) {
    resultModel.answers["decisionMaker" + (i + 1) + "Influence"] = Math.random() * 100;
  }

  resultModel.answers["decisionMakerCustom0Influence"] = Math.random() * 100;

  // Reconnect
  resultModel.answers.reconnect = Math.floor(Math.random() * 7) + 1;

  // One piece of advice
  resultModel.answers.onePieceAdvice = loremIpsum({ count: 10, units: 'words' });
  
  // Spit out the result
  return resultModel.answers;
};