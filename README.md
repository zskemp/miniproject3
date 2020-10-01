# Miniproject 3

Miniproject 3 is a SMART on FHIR web application. Using a SMART app launcher, this web app can be used to view medical 

## What it is

React Javascript project that can be run from a SMART application launcher such as SMART App Launcher. IUI uses Material-UI library, and FHIR interoperability uses [SMART JS Client Library](http://docs.smarthealthit.org/client-js/). 

## How to run

### Online - Heroku

Project is deployed to Heroku, and can be accessed at: [URL](https://google.com). To access it appropriately, one should use a [SMART App Launcher]() that points to the heroku url's `index.html` file. 

```
HEROKU URL
```


### Locally - npm start

Additionally, app can be run locally by pulling Github repo, and running:
```
npm install
npm start
```

The app will then be launched into local web browser. However, this is fairly uninteresting as it is a SMART app. Again, the [SMART App Launcher](https://launch.smarthealthit.org/?auth_error=&fhir_version_1=r4&fhir_version_2=r4&iss=&launch_ehr=1&launch_url=http%3A%2F%2Flocalhost%3A3000%2Findex.html&patient=&prov_skip_auth=1&provider=&pt_skip_auth=1&public_key=&sb=&sde=&sim_ehr=0&token_lifetime=15&user_pt=) can be used while pointing at local. It should be noted that this is a React application and there is no `launch.html`, but instead a `index.html` file to point the launcher at.

```
http://localhost:3000/index.html
```
