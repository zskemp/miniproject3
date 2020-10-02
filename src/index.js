/*!

=========================================================
* Material Dashboard React - v1.9.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2020 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";
import { Router, Route, Switch, Redirect } from "react-router-dom";

// core components
import App from "layouts/app.js";
import "assets/css/material-dashboard-react.css?v=1.9.0";

import { oauth2 as SMART } from "fhirclient";

const hist = createBrowserHistory();


SMART.init({
  iss:
      "https://r4.smarthealthit.org",
  redirectUri: "test.html",
  clientId: "0ab9e729-2954-4437-93ee-145ffd7180e7",
  scope: "patient/Patient.read patient/Observation.read launch online_access openid profile fhirUser",
  completeInTarget: true
})
  .then(
      (client => {

        // Poor programming way to set global client
        window.client = client;

        console.log("index client");
        console.log(client);
        console.log(client.patient.id);

        ReactDOM.render(
          <Router history={hist}>
            <Switch>
              <Route path="/user" component={App} client={client}/>
              <Redirect from="/" to="/user/health" />
            </Switch>
          </Router>,
          document.getElementById("root")
        );
      }),
      error => {
          console.error(error);
          ReactDOM.render(
              <>
                  <br />
                  <pre>{error.stack}</pre>
              </>,
              document.getElementById("root")
          );
      }
  );
