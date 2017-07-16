var pjson = require('./package.json'),
  mysql = require('mysql'),
  finercommon = require('finercommon'),
  colors = require('colors'),
  md5 = require('md5');

var dbCluster = {
  connectionLimit: 5,
  host: pjson.config.db.host,
  user: pjson.config.db.user,
  password: pjson.config.db.pw
};

// Set up the connection pool
var connectionPool = mysql.createPool(dbCluster);
pjson.config.pool = connectionPool;

// Tell us whats going on
console.log(("Setting fixtures @ " + (new Date()).toString() + "...").magenta);
console.log("Clearing existing data...");
finercommon
  .models
  .DeleteAll(pjson.config, (err) => {
    if (err) {
      console.log("ERROR".red, err);
    } else {
      console.log("Successful!".green);
      console.log("Creating fixture data...");
      finercommon
        .models
        .Account
        .Create(pjson.config, {
          name: "Alexei White",
          email: "alexei.white@gmail.com",
          password: "password",
          email_verified: 1
        }, (err, act) => {
          if (err) {
            console.log("ERROR".red, err);
          } else {
            console.log(("Created account for " + act.name + " (password \"password\")...").green);
            finercommon
              .models
              .Organization
              .Create(pjson.config, {
                name: "FunCo International"
              }, (err, org) => {
                if (err) {
                  console.log("ERROR".red, err);
                } else {
                  console.log(("Created organization " + org.name + "...").green);
                  finercommon
                    .models
                    .OrganizationAssociation
                    .Create(pjson.config, {
                      account_id: act.id,
                      organization_id: org.id,
                      assoc_type: 0,
                      perm_level: 0
                    }, (err, assoc) => {
                      if (err) {
                        console.log("ERROR".red, err);
                      } else {
                        console.log(("Created association between " + org.name + " and " + act.name + "...").green);
                        finercommon
                          .models
                          .Prospect
                          .Create(pjson.config, {
                            name: "Joe Blow",
                            organization_id: org.id
                          }, (err, prosp) => {
                            if (err) {
                              console.log("ERROR".red, err);
                            } else {
                              console.log(("Created prospect " + prosp.name + " for " + org.name + "...").green);
                              finercommon.models.Survey.Create(pjson.config, {
                                name: "My Fun Survey",
                                organization_id: org.id,
                                prospect_id: prosp.id,
                                guid: "testsurvey",
                                survey_model: JSON.stringify(finercommon.models.Survey.getSurveyFixture())
                              }, (err, sv) => {
                                if (err) {
                                  console.log("ERROR".red, err);
                                } else {
                                  console.log(("Created survey " + sv.name + " for " + org.name + " with guid \"" + sv.guid + "\"...").green);
                                  console.log(("Load survey at http://localhost:8080/s/" + sv.guid).yellow)
                                  console.log("Done.");
                                  process.exit();
                                }
                              })
                            }
                          })
                      }
                    });
                }
              })
          }
        });
    }
  });