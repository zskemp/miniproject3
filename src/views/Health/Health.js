/*eslint-disable*/
import React from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
import AddAlert from "@material-ui/icons/AddAlert";
// core components
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import Button from "components/CustomButtons/Button.js";
import SnackbarContent from "components/Snackbar/SnackbarContent.js";
import Snackbar from "components/Snackbar/Snackbar.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";
import CardIcon from "components/Card/CardIcon.js";
import Icon from "@material-ui/core/Icon";
import ChartistGraph from "react-chartist";

import Store from "@material-ui/icons/Store";
import Warning from "@material-ui/icons/Warning";
import DateRange from "@material-ui/icons/DateRange";
import LocalOffer from "@material-ui/icons/LocalOffer";
import Update from "@material-ui/icons/Update";
import Accessibility from "@material-ui/icons/Accessibility";
import BugReport from "@material-ui/icons/BugReport";
import Code from "@material-ui/icons/Code";
import Cloud from "@material-ui/icons/Cloud";

import InputLabel from "@material-ui/core/InputLabel";
import CustomInput from "components/CustomInput/CustomInput.js";

// FHIR import
import FHIR from "fhirclient";

import { dailySalesChart } from "variables/charts.js";
import styles from "assets/jss/material-dashboard-react/views/dashboardStyle.js";


// const styles = {
//   cardCategoryWhite: {
//     "&,& a,& a:hover,& a:focus": {
//       color: "rgba(255,255,255,.62)",
//       margin: "0",
//       fontSize: "14px",
//       marginTop: "0",
//       marginBottom: "0"
//     },
//     "& a,& a:hover,& a:focus": {
//       color: "#FFFFFF"
//     }
//   },
//   cardTitleWhite: {
//     color: "#FFFFFF",
//     marginTop: "0px",
//     minHeight: "auto",
//     fontWeight: "300",
//     fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
//     marginBottom: "3px",
//     textDecoration: "none",
//     "& small": {
//       color: "#777",
//       fontSize: "65%",
//       fontWeight: "400",
//       lineHeight: "1"
//     }
//   }
// };


const useStyles = makeStyles(styles);

// ---------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
      return Number(parseFloat((ob.valueQuantity.value)).toFixed(2));
    // return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return "";
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// helper function to calculate age
function calcAge(birthDate) {
  var today = new Date();
  var birthDay = new Date(birthDate);
  var age = today.getFullYear() - birthDay.getFullYear();
  return age;
}

// helper function to display locked info
function displayPatientInfo(birthDate, gender) {
  var age = calcAge(birthDate);
  document.getElementById('age-disabled').value = age;
  document.getElementById('sex-disabled').value = gender;
}

// helper function to display locked info
function displayLastObs(height, weight, waist_size, hdl, ldl, systolicbp, diastolicbp) {
  document.getElementById('height').value = height;
  document.getElementById('weight').value = weight;
  document.getElementById('waist-size').value = waist_size;
  document.getElementById('hdl').value = hdl;
  document.getElementById('ldl').value = ldl;
  document.getElementById('systolic').value = systolicbp;
  document.getElementById('diastolic').value = diastolicbp;
}

// Parse Weight and HDL Array into timestamp and value
function getChartData(obs_array) {
  var sorted_data = {
    labels: [],
    series: [[]]
  }
  obs_array.sort(function(a, b) {
    return new Date(a.meta.lastUpdated) - new Date(b.meta.lastUpdated)
  });

  obs_array.forEach(function (item) {
    var lastUpdate_date = new Date(item.meta.lastUpdated);
    let readable_date = lastUpdate_date.getDate() + '-' + (lastUpdate_date.getMonth()+1) + '-' + lastUpdate_date.getFullYear().toString().substr(-2);
    sorted_data.labels.push(readable_date);
    sorted_data.series[0].push(item.valueQuantity.value);
  });

  return sorted_data 
}

// Update Charts
function displayCharts(data, chart) {
  chart.update(data)
}

// ---------------------------------------------------------------------

export default function Notifications() {
  const classes = useStyles();
  const [healthy, setHealthy] = React.useState(false);
  const [caution, setCaution] = React.useState(false);
  const [unhealthy, setUnhealthy] = React.useState(false);
  const [showMetrics, setShowMetrics] = React.useState(false);

  // React.useEffect(() => {
  //   // Specify how to clean up after this effect:
  //   return function cleanup() {
  //     // to stop the warning of calling setState of unmounted component
  //     var id = window.setTimeout(null, 0);
  //     while (id--) {
  //       window.clearTimeout(id);
  //     }
  //   };
  // });


  // My LOGIC
  FHIR.oauth2.ready().then(function(client) {

    console.log("health client");
    console.log(client);
    console.log(client.patient.id);

    // CREATE THING (SKIP OVER)
    function build_create_json(target, value) {
      var data;
    
      if(target == "height") {
        data = {
          url: "Observation/",
          resourceType: "Observation",
          subject: {reference: "Patient/" + client.patient.id},
          code: {
            coding: [
              {system: "http://loinc.org", code: "8302-2", display: "Height"}
            ], 
            text: "Height"
          },
          valueQuantity: {
            code: "cm",
            system: "http://unitsofmeasure.org",
            unit: "cm",
            value: value,
          }
        }
      } else if(target == "weight") {
        data = {
          url: "Observation/",
          resourceType: "Observation",
          subject: {reference: "Patient/" + client.patient.id},
          code: {
            coding: [
              {system: "http://loinc.org", code: "29463-7", display: "Body weight"}
            ], 
            text: "Body weight"
          },
          valueQuantity: {
            code: "kg",
            system: "http://unitsofmeasure.org",
            unit: "kg",
            value: value,
          }
        }
      } else if(target == "waist_size") {
        data = {
          url: "Observation/",
          resourceType: "Observation",
          subject: {reference: "Patient/" + client.patient.id},
          code: {
            coding: [
              {system: "http://loinc.org", code: "56115-9", display: "Waist Circumference by NCFS"}
            ], 
            text: "Waist Circumference"
          },
          valueQuantity: {
            code: "cm",
            system: "http://unitsofmeasure.org",
            unit: "cm",
            value: value,
          }
        }
      } else if(target == "hdl") {
        data = {
          url: "Observation/",
          resourceType: "Observation",
          subject: {reference: "Patient/" + client.patient.id},
          code: {
            coding: [
              {system: "http://loinc.org", code: "2085-9", display: "Cholesterol in HDL [Mass/Vol]"}
            ], 
            text: "HDL"
          },
          valueQuantity: {
            code: "mg/dL",
            system: "http://unitsofmeasure.org",
            unit: "mg/dL",
            value: value,
          }
        }
      } else if(target == "ldl") {
        data = {
          url: "Observation/",
          resourceType: "Observation",
          subject: {reference: "Patient/" + client.patient.id},
          code: {
            coding: [
              {system: "http://loinc.org", code: "2089-1", display: "Cholesterol in LDL [Mass/Vol]"}
            ], 
            text: "LDL"
          },
          valueQuantity: {
            code: "mg/dL",
            system: "http://unitsofmeasure.org",
            unit: "mg/dL",
            value: value,
          }
        }
      } else if(target == "sys") {
        data = {
          url: "Observation/",
          resourceType: "Observation",
          subject: {reference: "Patient/" + client.patient.id},
          code: {
            coding: [
              {system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure"}
            ], 
            text: "Systolic blood pressure"
          },
          valueQuantity: {
            code: "mm[Hg]",
            system: "http://unitsofmeasure.org",
            unit: "mm[Hg]",
            value: value,
          }
        }
      } else if(target == "dia") {
        data = {
          url: "Observation/",
          resourceType: "Observation",
          subject: {reference: "Patient/" + client.patient.id},
          code: {
            coding: [
              {system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure"}
            ], 
            text: "Diastolic blood pressure"
          },
          valueQuantity: {
            code: "mm[Hg]",
            system: "http://unitsofmeasure.org",
            unit: "mm[Hg]",
            value: value,
          }
        }
      }
      return data;
    }


    // GLOBAL VAR FOR UPDATING WEIGHT AND BP CHART
    var weightData;
    var hdlData;
    var chart_weight;
    var chart_bp;



    // get patient object and then display its demographics info in the banner
    client.request(`Patient/${client.patient.id}`).then(
      function(patient) {
        console.log(patient);
        displayPatientInfo(patient.birthDate, patient.gender);
      }
    );

    // Patient codes
    var query = new URLSearchParams();
    query.set("patient", client.patient.id);
    query.set("_count", 100);
    query.set("_sort", "-date");
    query.set("code", [
      'http://loinc.org|8462-4', // Diastolic
      'http://loinc.org|8480-6', // Systolic
      'http://loinc.org|2085-9', // HDL
      'http://loinc.org|2089-1', // ldl
      'http://loinc.org|55284-4', // BP
      'http://loinc.org|3141-9',
      'http://loinc.org|8302-2', // Height
      'http://loinc.org|29463-7', // Weight
      'http://loinc.org|56115-9', // Waist Circumference
    ].join(","));
    // Observations
    client.request("Observation?" + query, {
      pageLimit: 0,
      flat: true
    }).then(
      function(ob) {

        console.log(ob);

        // group all of the observation resoruces by type into their own
        var byCodes = client.byCodes(ob, 'code');
        var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
        var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
        var hdl = byCodes('2085-9');
        var ldl = byCodes('2089-1');
        var height = byCodes('8302-2');
        var weight = byCodes('29463-7');
        var waist_size = byCodes('56115-9');

        weightData = getChartData(weight);
        hdlData = getChartData(hdl);

        chart_weight = new Chartist.Line('#chart-weight', weightData);
        chart_weight.on('draw', dailySalesChart.animation.draw)

        chart_bp = new Chartist.Line('#chart-bp', hdlData);
        chart_bp.on('draw', dailySalesChart.animation.draw)
        
        var last_height = getQuantityValueAndUnit(height.slice(-1)[0] );
        var last_weight = getQuantityValueAndUnit(weight.slice(-1)[0] );
        var last_waist_size = getQuantityValueAndUnit(waist_size.slice(-1)[0] );
        var last_hdl = getQuantityValueAndUnit(hdl.slice(-1)[0] );
        var last_ldl = getQuantityValueAndUnit(ldl.slice(-1)[0] );
        var last_sys = systolicbp;
        var last_dia = diastolicbp;

        displayLastObs(last_height, last_weight, last_waist_size, last_hdl, last_ldl, last_sys, last_dia);

    });


    // Create New Measurement
    function addMeasurements() {
      var height = document.getElementById('height').value
      var weight = document.getElementById('weight').value
      var waist_size = document.getElementById('waist-size').value
      var hdl = document.getElementById('hdl').value
      var ldl = document.getElementById('ldl').value
      var systolic = document.getElementById('systolic').value
      var diastolic = document.getElementById('diastolic').value

      var type_list = ["height", "weight", "waist_size", "hdl", "ldl", "sys", "dia"]
      var create_list = [height, weight, waist_size, hdl, ldl, systolic, diastolic]

      for(var i = 0; i < create_list.length; i++) {
        var obs_type = type_list[i];
        var obs_val = create_list[i];
        if(obs_val != "") {
          var data = build_create_json(obs_type, obs_val);

          client.create(data, {})
          .then(function(resp) {
            console.log("resp:")
            console.log(resp);        
          });

          let today = new Date();
          let readable_today = today.getDate() + '-' + (today.getMonth()+1) + '-' + today.getFullYear();
          if(obs_type == "weight") {
            weightData.labels.push(readable_today);
            weightData.series[0].push(obs_val);
            displayCharts(weightData, chart_weight);
          } else if(obs_type == "hdl") {
            hdlData.labels.push(readable_today);
            hdlData.series[0].push(obs_val);
            displayCharts(hdlData, chart_bp);
          }
        }
      }
    }

    function showNotification() {

      // Must show metrics-card first or else it is null and breaks everything in this function
      setShowMetrics(true)

      var height = document.getElementById('height').value
      var weight = document.getElementById('weight').value
      var waist_size = document.getElementById('waist-size').value
      var hdl = document.getElementById('hdl').value
      var ldl = document.getElementById('ldl').value
      var systolic = document.getElementById('systolic').value
      var diastolic = document.getElementById('diastolic').value

      var overall_health_score = 0
  
      // BMI
      var bmi = Math.round((weight / ((height / 100.0) ** 2)))
      var bmi_risk = "Normal";
      if(bmi < 18.5) {
        bmi_risk = "Underweight";
      } else if (bmi >= 18.5 && bmi < 25) {
        bmi_risk = "Normal";
      } else if (bmi >= 25 && bmi < 30) {
        bmi_risk = "Overweight";
        overall_health_score += 1
      } else {
        bmi_risk = "Obese";
        overall_health_score += 2
      }
      document.getElementById('bmi-value').innerHTML = bmi
      document.getElementById('bmi-footer').innerHTML = bmi_risk
  
      // RFM
      var rfm = "N/A";
      var rfm_risk = "Normal";
      if(waist_size != "") {
        if(client.patient.gender == "male") {
          rfm = Math.round(64 - (20 * (parseFloat(height) / parseFloat(waist_size))))
          if(rfm < 12.5) {
            rfm_risk = "Underfat";
          } else if (rfm >= 12.5 && rfm < 22) {
            rfm_risk = "Healthy";
          } else if (rfm >= 22 && rfm < 28) {
            rfm_risk = "Overfat";
            overall_health_score += 1
          } else {
            rfm_risk = "Obese";
            overall_health_score += 2
          }
        } else {
          rfm = Math.round(76 - (20 * (parseFloat(height) / parseFloat(waist_size))))
          if(rfm < 20) {
            rfm_risk = "Underfat";
          } else if (rfm >= 20 && rfm < 34) {
            rfm_risk = "Healthy";
          } else if (rfm >= 34 && rfm < 40) {
            rfm_risk = "Overfat";
            overall_health_score += 1
          } else {
            rfm_risk = "Obese";
            overall_health_score += 2
          }
        }
      }

      document.getElementById('rfm-value').innerHTML = rfm
      document.getElementById('rfm-footer').innerHTML = rfm_risk
      

      // Blood Pressure / Hypertension
      var bp_risk = "Normal";
      var bp_comment = "";

      if(systolic < 125) {
        bp_risk = "Normal"
      } else if (systolic >= 125 && systolic < 145) {
        bp_risk = "Elevated"
        bp_comment = "Speak with your doctor"
        overall_health_score += 1
      } else {
        bp_risk = "High"
        bp_comment = "Speak with your doctor immediately"
        overall_health_score += 2
      }

      document.getElementById('bp-value').innerHTML = bp_risk
      document.getElementById('bp-footer').innerHTML = bp_comment
      
      // Cholesterol / Hypercholesterolemia
      var cholesterol_risk = "Low";
      var cholesterol_comment = "";

      if(ldl < 120) {
        cholesterol_risk = "Normal"
      } else if (ldl >= 120 && ldl < 160) {
        cholesterol_risk = "Elevated"
        cholesterol_comment = "Speak with your doctor"
        overall_health_score += 1
      } else {
        cholesterol_risk = "High"
        cholesterol_comment = "Speak with your doctor immediately"
        overall_health_score += 2
      }

      document.getElementById('cholesterol-value').innerHTML = cholesterol_risk
      document.getElementById('cholesterol-footer').innerHTML = cholesterol_comment

      // Overall health score
      var score_type = "healthy";
      if(overall_health_score <= 2) {
        score_type = "healthy"
      } else if (overall_health_score > 2 && overall_health_score < 6) {
        score_type = "caution"
      } else {
        score_type = "unhealthy"
      }
  
      switch (score_type) {
        case "healthy":
          if (!healthy) {
            setHealthy(true);
            setTimeout(function() {
              setHealthy(false);
            }, 6000);
          }
          break;
        case "caution":
          if (!caution) {
            setCaution(true);
            setTimeout(function() {
              setCaution(false);
            }, 6000);
          }
          break;
        case "unhealthy":
          if (!unhealthy) {
            setUnhealthy(true);
            setTimeout(function() {
              setUnhealthy(false);
            }, 6000);
          }
          break;
        default:
          break;
      }
    };
  
    //event listner when the add button is clicked to call the function that will add the note to the weight observation
    document.getElementById('new_measurement_button').addEventListener('click', addMeasurements);
    document.getElementById('calculate_metrics_button').addEventListener('click', showNotification);


  }).catch(console.error);




  return (
    <div>
      <Card>
        <CardHeader color="info">
          <h4 className={classes.cardTitleWhite}>Health Overview</h4>
          <p className={classes.cardCategoryWhite}>
            A visualization of the most important health data for preventative healthcare, as well as a tool to input additional measurements (pre-populated with the latest record for your convenience).
          </p>
        </CardHeader>
        <CardBody>
          <GridContainer>
            <GridItem xs={12} sm={12} md={6}>
              <h5>Latest Health Measurement</h5>
              <CardBody>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={5}>
                    <CustomInput
                      labelText="Age"
                      id="age-disabled"
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        disabled: true
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={5}>
                    <CustomInput
                      labelText="Sex"
                      id="sex-disabled"
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        disabled: true
                      }}
                    />
                  </GridItem>
                  
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={4}>
                    <CustomInput
                      labelText="Height (cm)"
                      id="height"
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={4}>
                    <CustomInput
                      labelText="Weight (kg)"
                      id="weight"
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={4}>
                    <CustomInput
                      labelText="Waist Size (cm)"
                      id="waist-size"
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={5}>
                    <CustomInput
                      labelText="HDL- Cholesterol (mg/dL)"
                      id="hdl"
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={5}>
                    <CustomInput
                      labelText="LDL - Cholesterol (mg/dL)"
                      id="ldl"
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} sm={12} md={5}>
                    <CustomInput
                      labelText="Systolic BP (mm[Hg])"
                      id="systolic"
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={12} md={5}>
                    <CustomInput
                      labelText="Diastolic BP (mm[Hg])"
                      id="diastolic"
                      formControlProps={{
                        fullWidth: true
                      }}
                    />
                  </GridItem>
                </GridContainer>
              </CardBody>
              <CardFooter>
                <Button color="warning" id="new_measurement_button">Record New Measurement</Button>
              </CardFooter>  
            </GridItem>
            <GridItem xs={12} sm={12} md={6}>
              <h5>Weight over Time</h5>
              <br />
              <CardHeader color="warning">
                  <div id="chart-weight" className="ct-chart"></div>
              </CardHeader>
              <br />
              <h5>HDL over Time</h5>
              <br />
              <CardHeader color="warning">
                  <div id="chart-bp" className="ct-chart"></div>
              </CardHeader>
            </GridItem>
          </GridContainer>
          <br />
          <br />
          <GridContainer justify="center">
            <GridItem xs={12} sm={12} md={6} style={{ textAlign: "center" }}>
              <h5>
                Health Review Calculation
                <br />
                <small>Calculate BMI, RFM, Hypertension, and Hypercholesterolemia health metrics.</small>
              </h5>
            </GridItem>
          </GridContainer>
          <GridContainer justify="center">
            <GridItem xs={12} sm={12} md={10} lg={8}>
              <GridContainer justify="center">
                <GridItem xs={12} sm={12} md={4}>
                  <Button
                    fullWidth
                    color="info"
                    id="calculate_metrics_button"
                  >
                    Evaluate
                  </Button>
                  <Snackbar
                    place="tr"
                    color="success"
                    icon={AddAlert}
                    message="You are super healthy. Keep on preventing illness!"
                    open={healthy}
                    closeNotification={() => setHealthy(false)}
                    close
                  />
                  <Snackbar
                    place="tr"
                    color="warning"
                    icon={AddAlert}
                    message="You have some health metrics that could be concerning. Speak with your doctor, but don't stress."
                    open={caution}
                    closeNotification={() => setCaution(false)}
                    close
                  />
                  <Snackbar
                    place="tr"
                    color="danger"
                    icon={AddAlert}
                    message="You are at high risk of a preventable disease. See your doctor immediately."
                    open={unhealthy}
                    closeNotification={() => setUnhealthy(false)}
                    close
                  />
                </GridItem>
              </GridContainer>
            </GridItem>
          </GridContainer>
        </CardBody>
      </Card>
      { showMetrics ? <Card>
      <CardHeader color="info">
        <h4 className={classes.cardTitleWhite}>Prevent!</h4>
        <p className={classes.cardCategoryWhite}>
          Here are some metrics and advice on how to modify your health to prevent illnesses and stay healthy!
        </p>
      </CardHeader>
      <CardBody>
        <GridContainer>
        <GridItem xs={12} sm={6} md={3}>
            <Card>
              <CardHeader color="warning" stats icon>
                <CardIcon color="warning">
                <Icon>accessibility</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>BMI</p>
                <h3 className={classes.cardTitle} id="bmi-value"></h3>
              </CardHeader>
              <CardFooter stats>
                <div className={classes.stats} id="bmi-footer"></div>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={3}>
            <Card>
              <CardHeader color="warning" stats icon>
                <CardIcon color="warning">
                  <Icon>accessibilitynew</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>RFM</p>
                <h3 className={classes.cardTitle} id="rfm-value"></h3>
              </CardHeader>
              <CardFooter stats>
                <div className={classes.stats} id="rfm-footer"></div>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={3}>
            <Card>
              <CardHeader color="warning" stats icon>
                <CardIcon color="warning">
                <Icon>favorite</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Hypertension Risk</p>
                <h3 className={classes.cardTitle} id="bp-value"></h3>
              </CardHeader>
              <CardFooter stats>
                <div className={classes.stats} id="bp-footer"></div>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={3}>
            <Card>
              <CardHeader color="warning" stats icon>
                <CardIcon color="warning">
                  <Icon>whatshot</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Hypercholesterolemia Risk</p>
                <h3 className={classes.cardTitle} id="cholesterol-value"></h3>
              </CardHeader>
              <CardFooter stats>
                <div className={classes.stats} id="cholesterol-footer"></div>
              </CardFooter>
            </Card>
          </GridItem>
          
        </GridContainer>
      </CardBody>
    </Card> : null }
  </div>
  );
}
