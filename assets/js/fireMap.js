/*
Real-Time Fire Incident Map

Created under Dr. Jiao's Urban Information Lab.
*/

var activeFires = new L.FeatureGroup();
var inactiveFires = new L.FeatureGroup();
var purpleAirMonitors = new L.FeatureGroup();
var microsoftAirMonitors = new L.FeatureGroup();
var currentShapefile = null;
var markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    //zoomToBoundsOnClick: false,
    iconCreateFunction: function(cluster) {
        var childCount = cluster.getChildCount();

        var markers = cluster.getAllChildMarkers();
        var sum = 0;
        for (var i = 0; i < markers.length; i++) {
            //console.log(markers[i]);
            sum += markers[i].options.title;
        }
        var avg = sum / markers.length;

var c = ' marker-cluster-';
if (avg < 10) {
    c += 'small';
} else if (avg < 100) {
    c += 'medium';
} else {
    c += 'large';
}

return new L.DivIcon({ html: '<div><span><b>' + Math.round(avg) + '</b></span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });
    }
});
    
    //Input: map instance and an array of string
    async function mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag) {
        
        // Remove all fires from map
        if(map != null) {
            map.removeLayer(activeFires);
            map.removeLayer(inactiveFires);

            activeFires.clearLayers();
            inactiveFires.clearLayers();
            onehourForecastGroup.clearLayers();
            twohourForecastGroup.clearLayers();
            threehourForecastGroup.clearLayers();

            addMapLayer(map)

        }


        let sampleData = [
            {
                "title": "BRUSH - Brush Fire",
                "link": "http://maps.google.com/maps?q=30.767735,-97.876783",
                "guid": {
                    "@isPermaLink": "false",
                    "#text": "9B5927CEC83EE94F602974CA14A6FFD0569B777A"
                },
                "description": "6780-8398 N US 183 | NON - ADVISED INCIDENT | 16:48:52",
                "pubDate": "Mon, 14 Feb 2022 16:48:52 CDT",
                "active_status": "yes"
            },
            {
                "title": "Traffic Injury Pri 4F",
                "link": "http://maps.google.com/maps?q=30.399615,-97.850904",
                "guid": {
                    "@isPermaLink": "false",
                    "#text": "E1CF984DAC4C3E377F4662FCCCE3602106165EEF"
                },
                "description": "11213 Fm 2222 Rd | AFD | 16:53:43",
                "pubDate": "Mon, 14 Feb 2022 16:53:43 CDT",
                "active_status": "yes"
            },
            {
                "title": "ALARM - Fire Alarm",
                "link": "http://maps.google.com/maps?q=30.321938,-97.808294",
                "guid": {
                    "@isPermaLink": "false",
                    "#text": "3F8BED0F0E2ADB62764BF557B3C92D7E6B2E9FEC"
                },
                "description": "2537 WAYMAKER WAY | AFD | 16:14:52",
                "pubDate": "Mon, 14 Feb 2022 16:14:52 CDT",
                "active_status": "no"
            },
            {
                "title": "RESQT - Rescue Task Force",
                "link": "http://maps.google.com/maps?q=30.501646,-97.790996",
                "guid": {
                    "@isPermaLink": "false",
                    "#text": "CEC1022BEFB63F729C72D1EE8A071FCD2876D273"
                },
                "description": "15116 Dodge Cattle Cv | AFD | 16:37:09",
                "pubDate": "Mon, 14 Feb 2022 16:37:09 CDT",
                "active_status": "no"
            }
        ];

        let rawData = [];
        let cities = ["", "Dallas", "Houston","SanAntonio","OklahomaCity","LosAngeles","Riverside","ElPaso","SanDiego","Seattle"];
        console.log(date)
        for(city in cities) {
        for (let i = 0; i < dateArray.length; i++) {
            try{
                let date = dateArray[i];
                let jsonUrl = '../data/' + date + '-FireMap' + cities[city] + '.json';
                let response = await fetch(jsonUrl);
                let currentData = await response.json();

                
                // console.log(i);
                // console.log(rawData);
                //if (i === 0) {
                //    rawData = currentData.rss.channel.item;
                //} else {
                    rawData.push.apply(rawData, currentData.rss.channel.item);
                //}
            } catch(e) {
                break;
            }
            }
        }

        let fireData = rawData; 
        //let fireData = sampleData;

        // check if we have data point
        if (fireData != undefined) {
            // check if we only have one data point
            if (!Array.isArray(fireData)) {
                processData(fireData)
            } else {
                // loop through each data point
                fireData.forEach(data => {
                  //  if ((inactive_flag === false && data.active_status === "yes") || inactive_flag === true) {
                        try { 
                        processData(data)
                        }
                        catch(e) { 
                        console.log(e)
                        }
                    }

                //}
                );
            }
        }

        if(currentShapefile == null) {
            buildShapefile(map, shapefile_display_flag);
        }

        if (purple_air_diaplay_flag == true) {
            mapPurpleAirData(map);
        }
        if (microsoft_air_display_flag == true) {
            mapMicrosoftAirData(map);
        }

        // hide air quality legend
        var airQualityLegend = document.querySelector('.air-quality-legend');
        if (!purple_air_diaplay_flag && !microsoft_air_display_flag) {
            airQualityLegend.style.display = 'none';
        } else {
            //airQualityLegend.style.display = 'flex';

        }

    }

    function processData(data) {
        let windDirections = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        let angles = [0, 25, 45, 65, 90, 115, 135, 155, 180, 205, 225, 245, 270, 295, 315, 335];
        var activeFireIcon = L.icon({
            iconUrl: "https://smartcity.tacc.utexas.edu/FireIncident/assets/images/fire.png",
            iconSize: [70, 70], // size of the icon
        });
        var windDirectionIcon = L.icon({
            iconUrl: "https://smartcity.tacc.utexas.edu/FireIncident/assets/images/arrow.png",
            iconSize: [70, 70], // size of the icon
        });
        var deactiveFireIcon = L.icon({
            iconUrl: "https://smartcity.tacc.utexas.edu/FireIncident/assets/images/deactive_fire.png",
            iconSize: [70, 70], // size of the icon
        });
        let link = data.link;
        let longNLatString = link.replace('http://maps.google.com/maps?q=', '');
        let longNLatArray = longNLatString.split(',');
        longNLatArray.forEach((x, i) => longNLatArray[i] = parseFloat(x))

        weatherDataAPI = 'https://api.weather.gov/points/' + longNLatString;

        var marker = L.marker(longNLatArray).addTo(map);

        let icon = activeFireIcon;
        if (data.active_status != "yes") {
            icon = deactiveFireIcon
            inactiveFires.addLayer(marker);
        } else {
            activeFires.addLayer(marker);
        }

        marker.setIcon(icon);

        getWeatherAPI(weatherDataAPI, marker, data, windDirectionIcon, windDirections, angles, longNLatArray, longNLatString);
    }

    async function getWeatherAPI(url, marker, fireData, windDirectionIcon, windDirections, angles, longNLatArray, longNLatString) {
        var response = await fetch(url);
        var api = await response.json();
        var hourlyApiUrl = api.properties.forecastHourly;
        // console.log(hourlyApiUrl);
        var response = await fetch(hourlyApiUrl);
        var hourlyData = await response.json();
        hourlyData1 = hourlyData.properties.periods[0];


        var markerPopup = `
        <span>
        <div style="
            font-size: xx-large;
            font-family: sans-serif;
            text-align: center;
            border-color: green;
            border-radius: 20px;
            color: black;
        ">
        <div class="location-info">
            <span>${fireData.title}</span><BR>

        </div>
        </div>
        <b>
        <span>Location: ${fireData.description.split('|')[0]}</span><BR>
        <span>Publish Date: ${fireData.pubDate}</span><BR>
        `;

        markerPopup += `<br><a id="moreButton" href="#" onclick="addMore()">More...</a>`

        markerPopup += `<div id="more" style="display:none">
        <div class="cur-weather-info">
            <span>Temperature: ${hourlyData1.temperature}℉ </span><BR>
            <span>Forecast: ${hourlyData1.shortForecast} </span><BR>
            <span>Wind Spead: ${hourlyData1.windSpeed}</span><BR>
            <span>Wind Direction: ${hourlyData1.windDirection} </span>
        </div>`;

        var tempTable = buildTemperatureTable(hourlyData.properties.periods);
        markerPopup += tempTable;

        markerPopup += `</div>`;

        marker.bindPopup(markerPopup, {
            maxWidth : 251
        });;

        // map wind direction
        let index = windDirections.indexOf(hourlyData1.windDirection);
        let angle = angles[index];
        if (fireData.active_status === "yes") {
            /*var windDirectionMarker = L.marker(longNLatArray, {
                icon: windDirectionIcon,
                rotationAngle: 90,
                rotationOrigin: 'center',
                zIndexOffset: -1,
            }).addTo(map); */
            addSmokeRegions(map, "../data/" + longNLatString)
        }

    }

    var onehourForecastGroup = L.layerGroup();
    var twohourForecastGroup = L.layerGroup();
    var threehourForecastGroup = L.layerGroup();

    function addSmokeRegions(map, KMLstring) {
        addForecastedSmoke(map, KMLstring + ".kml", onehourForecastGroup);
        addForecastedSmoke(map, KMLstring + ".kml2", twohourForecastGroup);
        addForecastedSmoke(map, KMLstring + ".kml3", threehourForecastGroup);
    }

    function addForecastedSmoke(map, KMLstring, forecastGroup) {
                console.log("Added smoke map " + KMLstring);
                // Load kml file
                try {
                fetch(KMLstring)
                .then(res => res.text())
                .then(kmltext => {
                    // Create new kml overlay
                    const parser = new DOMParser();
                    const kml = parser.parseFromString(kmltext, 'text/xml');
                    const track = new L.KML(kml);
                    forecastGroup.addLayer(track);
                });
            } catch (e) {
                console.log(e);
            }
    }

    // build temperature table for next 5 hours
    function buildTemperatureTable(hourlyData) {
        var data = ``;
        hourlyData.forEach((x, i) => {
            if (i <= 5) {
                var startTime = x.startTime.split('T')[1].split(':')[0];
                data += `
                <tr>
                    <td>${startTime}:00</td>
                    <td>${x.temperature}℉</td>
                    <td>${x.shortForecast}</td>
                    <td>${x.windDirection}</td>
                </tr>
                `;
            }

        });
        var table = `
        <table  style="
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 0.9em;
        font-family: sans-serif;
        min-width: 210px;
        min-height: 30px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
    ">
        <thead  style="
        text-align: center;
        padding: 10px 40px;
        font-size: smaller;
        background-color: #009375;
        color: #ffffff;
        text-align: center;
    ">
            <tr>
                <th>Time</th>
                <th>Temperature</th>
                <th>Forecast</th>
                <th>Wind Direction</th>
            </tr>
        <thead>
        <tbody>
            ${data}
        </tbody>
        <table/>
        `;
        return table;
    }

    function addMapLayer(map) {
        // L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=podpBxEPp3rRpfqa6JY8', {
        //     attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        // }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        console.log("BEING CALLED");
        map.addLayer(activeFires)
        if(inactive_flag)
        map.addLayer(inactiveFires)
        if(purple_air_diaplay_flag && microsoft_air_display_flag)
        map.addLayer(markers);
        else if(purple_air_diaplay_flag)
        map.addLayer(purpleAirMonitors)
        else
        map.addLayer(microsoftAirMonitors)
    
    }

    // placeholders for the L.marker and L.circle representing user's current position and accuracy
    var current_position, current_accuracy;

    function onLocationFound(e) {
    // if position defined, then remove the existing position marker and accuracy circle from the map
    console.log("location found");
    //console.log(e);

    if (current_position) {
        map.removeLayer(current_position);
        map.removeLayer(current_accuracy);
    }

    var radius = e.coords.accuracy / 10;

    const latlng = {
        lat: e.coords.latitude,
        lng: e.coords.longitude
    };

    /*const latlng = {          // Debug coordinates
        lat: 30.508119,
        lng: -97.811024
    };*/
    
    current_position = L.marker(latlng).addTo(map);
    current_accuracy = L.circle(latlng, radius).addTo(map);

    var warningLevel = "no";
    var it = 0;
    for (var i in onehourForecastGroup._layers) {
        for (var j in onehourForecastGroup._layers[i]._layers) {
            for (var k in onehourForecastGroup._layers[i]._layers[j]._layers) {
                //console.log(onehourForecastGroup._layers[i]._layers[j]._layers[k]);
                var inSmoke = onehourForecastGroup._layers[i]._layers[j]._layers[k].getBounds().contains(current_position._latlng);
                //console.log(inSmoke)
                if(inSmoke) {
                    //console.log(it);
                    warningLevel = (it==0) ? "a Moderate" : (it==1) ? "an Unhealthy for Sensitive Groups" : (it==2) ? "an Unhealthy" : (it==3) ? "a Very Unhealthy" : (it==4) ? "a Hazardous" : "no";
                }
                it++;
            }
            it = 0;
        }
    }

    // Display warning message
    console.log("Your area currently has " + warningLevel + " amount of smoke.")

    content = "Your area currently has " + warningLevel + " amount of smoke.";

    current_position.bindPopup(content, {
        closeButton: true
    });
    current_position.openPopup();

    map.setView(latlng);
    map.fitBounds(current_accuracy.getBounds());


    }

    function foundLocationGeocoded(e) {
        
    if (current_position) {
        map.removeLayer(current_position);
        map.removeLayer(current_accuracy);
    }

    var radius = 10;

    const latlng = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
    };

    /*const latlng = {          // Debug coordinates
        lat: 30.508119,
        lng: -97.811024
    };*/
    
    current_position = L.marker(latlng).addTo(map);
    current_accuracy = L.circle(latlng, radius).addTo(map);

    var warningLevel = "no";
    var it = 0;
    for (var i in onehourForecastGroup._layers) {
        for (var j in onehourForecastGroup._layers[i]._layers) {
            for (var k in onehourForecastGroup._layers[i]._layers[j]._layers) {
                //console.log(onehourForecastGroup._layers[i]._layers[j]._layers[k]);
                var inSmoke = onehourForecastGroup._layers[i]._layers[j]._layers[k].getBounds().contains(current_position._latlng);
                //console.log(inSmoke)
                if(inSmoke) {
                    //console.log(it);
                    warningLevel = (it==0) ? "a Moderate" : (it==1) ? "an Unhealthy for Sensitive Groups" : (it==2) ? "an Unhealthy" : (it==3) ? "a Very Unhealthy" : (it==4) ? "a Hazardous" : "no";
                }
                it++;
            }
            it = 0;
        }
    }

    // Display warning message
    console.log("Your area currently has " + warningLevel + " amount of smoke.")

    content = "Your area currently has " + warningLevel + " amount of smoke.";

    current_position.bindPopup(content, {
        closeButton: true
    });
    current_position.openPopup();

    map.setView(latlng);
    map.fitBounds(current_accuracy.getBounds());


    }


    function onLocationError(e) {
        console.error("Location found error");
        console.log(e);
    }

    function getUserLocation() {
        navigator.geolocation.getCurrentPosition(onLocationFound);

        /*navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
        maximumAge: 60000,
        timeout: 2000
        });*/
    }

    function getToday() {
        document.getElementById("CurrentSelectedDate").textContent = "⠀ ⠀᠎⠀ ⠀Today";
        var datePicker = document.querySelector('.date-picker');
        datePicker.style.display = 'none';
                                // clear all markers and rebuild map layer
                                /*map.eachLayer(function (layer) {
                                    map.removeLayer(layer);
                                });
                                addMapLayer(map);*/
                                // map today's fire data
                                dateArray = [];
                                var today = new Date();
                                var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + today.getDate()).slice(-2);
                                dateArray.push(date);
                                mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
                                // show status toggle button and uncheck checkbox
                                //statusToggle.style.display = 'flex';
                                //checkbox.checked = false;
    }

    function getYesterday() {
        document.getElementById("CurrentSelectedDate").textContent = "⠀ ⠀᠎⠀ ⠀Yesterday";
        var datePicker = document.querySelector('.date-picker');
        datePicker.style.display = 'none';
                        // clear all markers and rebuild map layer
                        /*map.eachLayer(function (layer) {
                            map.removeLayer(layer);
                        });
                        addMapLayer(map);*/
                        // map yesterday's fire data
                        dateArray = [];
                        var today = new Date();
                        var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + (today.getDate() - 1)).slice(-2);
                        dateArray.push(date);
                        mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
                        //statusToggle.style.display = 'none';

                    }


    function get3Days() {
        document.getElementById("CurrentSelectedDate").textContent = "⠀ ⠀᠎⠀ ⠀Last 3 Days";
        var datePicker = document.querySelector('.date-picker');
        datePicker.style.display = 'none';
                        // clear all markers and rebuild map layer
                        /*map.eachLayer(function (layer) {
                            map.removeLayer(layer);
                        });
                        addMapLayer(map);*/
                        // map fire data of past 3 days 
                        dateArray = [];
                        var today = new Date();
                        for (let i = 0; i < 3; i++) {
                            var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + (today.getDate() - i)).slice(-2);
                            dateArray.push(date);
                        }
                        mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
                        //statusToggle.style.display = 'none';

    }

    function getCustom() {
        document.getElementById("CurrentSelectedDate").textContent = "⠀ ⠀᠎⠀ ⠀Custom";

        var datePicker = document.querySelector('.date-picker');
        datePicker.style.display = 'none';
        // add event listener
        datePicker.addEventListener('change', (event) => {
            // clear all markers and rebuild map layer
            /*map.eachLayer(function (layer) {
                map.removeLayer(layer);
            });
            addMapLayer(map);*/
            mapFireIncident(map, [event.target.value], inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag)
        })
                                // show date selector
                                datePicker.style.display = 'block';
                                //statusToggle.style.display = 'none';
    }

    function buildSelectBar(map) {
        var checkList = document.getElementById('filter-menu');
        checkList.getElementsByClassName('anchor')[0].onclick = function (evt) {
            if (checkList.classList.contains('visible'))
                checkList.classList.remove('visible');
            else
                checkList.classList.add('visible');
        }
        // set up value of date picker
        var dateControl = document.querySelector('input[type="date"]');
        dateControl.value = date;
        dateControl.max = date;
        // hide date picker
        var datePicker = document.querySelector('.date-picker');
        datePicker.style.display = 'none';
        // add event listener
        datePicker.addEventListener('change', (event) => {
            // clear all markers and rebuild map layer
            /*map.eachLayer(function (layer) {
                map.removeLayer(layer);
            });
            addMapLayer(map);*/
            mapFireIncident(map, [event.target.value], inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag)
        })

        //build select button
        const barOuter = document.querySelector(".bar-outer");
        const options = document.querySelectorAll(".bar-grey .option");
        let current = 1;
        options.forEach((option, i) => (option.index = i + 1));
        options.forEach(option =>
            option.addEventListener("click", function () {
                barOuter.className = "bar-outer";
                barOuter.classList.add(`pos${option.index}`);
                if (option.index > current) {
                    barOuter.classList.add("right");
                } else if (option.index < current) {
                    barOuter.classList.add("left");
                }
                current = option.index;
                // console.log('index: ', current)

                datePicker.style.display = 'none';
                // define button onclick action
                switch (current) {
                    // Today Button
                    case 1:
                        // clear all markers and rebuild map layer
                        /*map.eachLayer(function (layer) {
                            map.removeLayer(layer);
                        });
                        addMapLayer(map);*/
                        // map today's fire data
                        dateArray = [];
                        var today = new Date();
                        var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + today.getDate()).slice(-2);
                        dateArray.push(date);
                        mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
                        // show status toggle button and uncheck checkbox
                        statusToggle.style.display = 'flex';
                        checkbox.checked = false;
                        break;

                    // Yesterday Button
                    case 2:
                        // clear all markers and rebuild map layer
                        /*map.eachLayer(function (layer) {
                            map.removeLayer(layer);
                        });
                        addMapLayer(map);*/
                        // map yesterday's fire data
                        dateArray = [];
                        var today = new Date();
                        var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + (today.getDate() - 1)).slice(-2);
                        dateArray.push(date);
                        mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
                        statusToggle.style.display = 'none';
                        break;

                    // Past 3 days Button
                    case 3:
                        // clear all markers and rebuild map layer
                        /*map.eachLayer(function (layer) {
                            map.removeLayer(layer);
                        });
                        addMapLayer(map);*/
                        // map fire data of past 3 days 
                        dateArray = [];
                        var today = new Date();
                        for (let i = 0; i < 3; i++) {
                            var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + (today.getDate() - i)).slice(-2);
                            dateArray.push(date);
                        }
                        mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
                        statusToggle.style.display = 'none';
                        break;

                    // Custom Button
                    case 4:
                        // show date selector
                        datePicker.style.display = 'block';
                        statusToggle.style.display = 'none';
                        break;
                }
            }));
    }

    function buildStatusToggleButton(map, checkbox) {
        
        if (checkbox.checked) {
            inactive_flag = true;
            map.addLayer(inactiveFires)
        } else {
            inactive_flag = false;
            map.removeLayer(inactiveFires);
        }


        /*
        checkbox.addEventListener('click', function (e) {
            // checkbox checked => all fire
            if (checkbox.checked) {
                inactive_flag = true;
            } else {
                inactive_flag = false;
            }
            // clear all markers and rebuild map layer
            map.eachLayer(function (layer) {
                map.removeLayer(layer);
            });
            addMapLayer(map);
            // map today's fire data
            dateArray = [];
            var today = new Date();
            var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + today.getDate()).slice(-2);
            dateArray.push(date);
            mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);

        })
        */
    }


    var cachedShapefile = null 

    function buildShapefile(map, shapefile_display_flag) {
        let shapefileName = "";
        let popupContent = ``;
        let shapefile = "";
        var fireRiskLegend = document.querySelector('.fire-risk-legend');
        var afdLegend = document.querySelector('.afd-legend');
        var hviLegend = document.querySelector('.hvi-legend');

        switch (shapefile_display_flag) {
            case 'fire-risk-radio':
                shapefileName = "../data/austin_wildfire_vulnerable_populations.zip";
                shpfile = new L.Shapefile(shapefileName, {
                    onEachFeature: function (feature, layer) {
                        popupContent = `
                            <div class="risk-estimate-info">
                                <span>Fire Category: ${feature.properties["FIRECAT"]}</span><BR>
                            </div>
                            <div class="basic-info">
                                <span>FIPS: ${feature.properties["FIPS"]}</span><BR>
                                <span>MAPTIP: ${feature.properties["MAPTIP"]}</span><BR>
                                <span>TRCTNAME: ${feature.properties["TRCTNAME"]}</span><BR>
                            </div>
                            <div class="stats-info">
                                <span>Families in Poverty: ${feature.properties["POPVAL"]} </span><BR>
                                <span>People Under 5: ${feature.properties["UND5VAL"]} </span><BR>
                                <span>People Over 65: ${feature.properties["OVR65VAL"]} </span><BR>
                                <span>People With Disability: ${feature.properties["DISABLVAL"]}</span><BR>
                                <span>ASTHMAVAL: ${feature.properties["ASTHMAVAL"]} </span>
                            </div>
                            
                        `;
                        // Instead of just displaying the number in the popup, make a gradient color scale

                        layer.bindPopup(popupContent);
                        let fireCat = feature.properties["FIRECAT"];
                        let words = fireCat.toLowerCase().split(' ');
                        if (words.includes("highest")) {
                            layer.options.color = "red";
                        } else if (words.includes("elevated")) {
                            layer.options.color = "orange";
                        } else {
                            layer.options.color = "yellow";

                        }

                        // make layer outline thicker
                        layer.options.weight = 0.8;

                        // makes lines thinner the further away they are depending on zoom level
                        // attach to zoom event
                        map.on('zoomend', function () {
                            //layer.options.weight = 0.5 * map.getZoom();
                        });
                        //layer.options.opacity = 1 / map.getZoom();


                    },
                    
                    
                })
                // hide fire risk legend
                document.getElementById('fireRiskType').innerHTML = "Fire Vulnerability Risk: "
                fireRiskLegend.style.display = 'flex';
                afdLegend.style.display = 'none';
                hviLegend.style.display = 'none';
                shpfile.addTo(map);
                currentShapefile = shpfile;
                break;
            case 'afd-radio':
                shapefileName = "../data/AFD Standard of Cover.zip";
                // var pasttern = new L.Pattern();
                shpfile = new L.Shapefile(shapefileName, {
                    onEachFeature: function (feature, layer) {
                        popupContent = `
                            <div class="basic-info">
                                <span>Number of Incidents: ${feature.properties["incidents"]}</span><BR>
                                <span>Responses in 8 mins: ${feature.properties["num_8min"]}</span><BR>
                                <span>Fire Station ID: ${feature.properties["battalio_1"]}</span><BR>
                                <span>Last Modified by: ${feature.properties["modified_b"]}</span><BR>

                            </div>
                            
                        `;
                        layer.bindPopup(popupContent);
                        layer.options.weight = 0.8;

                        let numIncidents = parseInt(feature.properties["incidents"]);
                        let numResponses = parseInt(feature.properties["num_8min"]);
                        let percent = numResponses / numIncidents;
                        if (percent >= 0.9) {
                            layer.options.color = "rgb(1, 106, 1)";
                        } else if (percent >= 0.8) {
                            layer.options.color = "#699d50";
                        } else if (percent >= 0.7) {
                            layer.options.color = "orange";
                        } else if (percent >= 0.6) {
                            layer.options.color = "#ff5500";
                        } else {
                            layer.options.color = "#704489";
                        }

                        // if(numIncidents <= 20) {
                        //     larer.options.fillColor = 'url(image.gif)';
                        // }
                    }
                })
                afdLegend.style.display = 'flex';
                fireRiskLegend.style.display = 'none';
                hviLegend.style.display = 'none';
                shpfile.addTo(map);
                currentShapefile = shpfile;
                break;
            case 'hvi-radio':
                shapefileName = "../data/HVI_Map.zip";
                shpfile = new L.Shapefile(shapefileName, {
                    onEachFeature: function (feature, layer) {
                        popupContent = `
                            <div class="basic-info">
                                <span>HVI Exposure: ${feature.properties["HVI_Exposu"]}</span><BR>
                                <span>HVI Sensitivity: ${feature.properties["HVI_Sens"]}</span><BR>
                                <span>HVI CAPA: ${feature.properties["HVI_CAPA"]}</span><BR>
                                <span>All: ${feature.properties["HVI_All"]}</span><BR>
                                <span>Geo ID: ${feature.properties["GEO_ID"]}</span><BR>
                            </div>
                            
                        `;
                        layer.bindPopup(popupContent);
                        let hvi_exposure = parseFloat(feature.properties["HVI_Exposu"]);
                        console.log(hvi_exposure)

                        if (hvi_exposure >= 0.9) {
                            layer.options.color = "rgb(1, 106, 1)";
                        } else if (hvi_exposure >= 0.8) {
                            layer.options.color = "#699d50";
                        } else if (hvi_exposure >= 0.6) {
                            layer.options.color = "orange";
                        } else if (hvi_exposure >= 0.4) {
                            layer.options.color = "#ff5500";
                        } else {
                            layer.options.color = "#704489";
                        }
                    }
                })
                // color by exposure, color map by 5 colors


                hviLegend.style.display = 'flex';
                afdLegend.style.display = 'none';
                fireRiskLegend.style.display = 'none';
                shpfile.addTo(map);
                currentShapefile = shpfile;
                break;
            /*
            case 'fireStations':
                // display CSV file of fire stations as points and add popups
                // use fetch to get the data
                fetch('../data/Fire_Stations.csv')
                    .then(response => response.text())
                    .then(text => {
                        // parse the CSV file
                        let stations = Papa.parse(text, {
                            header: true,
                            dynamicTyping: true,
                            skipEmptyLines: true
                        }).data;
                        //console.log(stations);
                        // loop through the stations and add them to the map
                        for (let station of stations) {
                            //console.log(station);
                            let marker = L.marker([station.LATITUDE, station.LONGITUDE]);
                            marker.bindPopup(`
                                <div class="basic-info
                                    <span>Station ID: ${station.STATION_ID}</span><BR>
                                    <span>Station Name: ${station.STATION_NAME}</span><BR>
                                    <span>Address: ${station.ADDRESS}</span><BR>
                                    <span>City: ${station.CITY}</span><BR>
                                    <span>Zip Code: ${station.ZIP_CODE}</span><BR>
                                    <span>Phone: ${station.PHONE}</span><BR>
                                    <span>Station Type: ${station.STATION_TYPE}</span><BR>
                                    <span>Station Status: ${station.STATION_STATUS}</span><BR>
                                    <span>Station Open Date: ${station.STATION_OPEN_DATE}</span><BR>
                                    <span>Station Close Date: ${station.STATION_CLOSE_DATE}</span><BR>
                                    <span>Station Area: ${station.STATION_AREA}</span><BR>
                                    <span>Station District: ${station.STATION_DISTRICT}</span><BR>
                                    <span>Station Division: ${station.STATION_DIVISION}</span><BR>

                                </div>
                            `);
                            marker.addTo(map);
                        }
                    })
                break; */

            case 'test-risk-radio':
                shapefileName = "../data/firerisk.shp.zip";
                var filePath = '../data/AverageFire.json';
                var result = window.AverageFire;
                cities = {
                    '48453' : '',  // Austin
                    '48113' : 'Dallas',
                    '48201' : 'Houston',
                    '48311' : 'SanAntonio',
                    '48405' : 'SanDiego',
                    '98101' : 'Seattle',
                    '48503' : 'ElPaso'
                }

                if(cachedShapefile == null) {
                shpfile = new L.Shapefile(shapefileName, {
                    onEachFeature: function (feature, layer) {

                        var averageNum = result[cities[feature.properties["ctid"].substring(0, 5)]];
                        //console.log(cities[feature.properties["ctid"].substring(0, 5)] + " average " + averageNum)

                        if (averageNum == undefined) {
                            console.log("undefined")
                            averageNum = 0;
                        }

                        let fireCat = "";
                        let randomGuess = feature.properties["numFires"];
                        if(randomGuess > 1.5 * averageNum) {
                            fireCat = "Highest Potential Zone"
                        } else if(randomGuess > 0.5 * averageNum) {
                            fireCat = "Elevated Potential Zone"
                        } else {
                            fireCat = "Potential Zone"
                        }

                        popupContent = `
                            <div class="risk-estimate-info">
                                <span>Fire Category: ${fireCat}</span><BR>
                                <span>Number of Fires: ${feature.properties["numFires"]}</span><BR>
                            </div>
                            <div class="basic-info">
                                <span>TRCTNAME: ${feature.properties["NAME"]}</span><BR>
                            </div>
                            
                        `;
                        layer.bindPopup(popupContent);
                        layer.options.weight = 0.8;

                        //let fireCat = feature.properties["FIRECAT"];
                        let words = fireCat.toLowerCase().split(' ');
                        if (words.includes("highest")) {
                            layer.options.color = "red";
                        } else if (words.includes("elevated")) {
                            layer.options.color = "orange";
                        } else if (words.includes("potential")) {
                            layer.options.color = "yellow";
                        } else {
                            layer.options.color = "transparent";
                        }

                    }
                })}
                else {
                    shpfile = cachedShapefile;
                }
           
                // hide fire risk legend
                document.getElementById('fireRiskType').innerHTML = "Urban Fire Risk: "
                fireRiskLegend.style.display = 'flex';
                afdLegend.style.display = 'none';
                hviLegend.style.display = 'none';
                shpfile.addTo(map);
                cachedShapefile = shpfile;
                currentShapefile = shpfile;
                break;


            case 'none-radio':
                //fireRiskLegend.style.display = 'none';
                //afdLegend.style.display = 'none';
                currentShapefile = null;
                fireRiskLegend.style.display = 'none';
                afdLegend.style.display = 'none';
                hviLegend.style.display = 'none';
                break;

        }
    }

    var runGetPurpleAirOnce = false;
    var runGetMicrosoftAirOnce = false;

    async function mapPurpleAirData(map) {

        if (runGetPurpleAirOnce) {
            return;
        }
        runGetPurpleAirOnce = true;

        let sampleData = [
            {
                "link": "https://map.purpleair.com/1/mAQI/a10/p604800/cC0?key=4Z0L6SM6TMMYSTX0&select=27519#14/30.28559/-97.73693",
                "active_status": "yes"
            },
            {
                "link": "https://map.purpleair.com/1/mAQI/a10/p604800/cC0?key=4Z0L6SM6TMMYSTX0&select=27569#13.69/30.28233/-97.72709",
                "active_status": "yes"
            },
        ];


        if(airData.length == 0) {
            let cities = {
                // Cities with northwest latitude, southwest latitude, northwest longitude, southwest longitude
                "":[30.747879,29.978325,-98.056977,-97.357011],
                "Dallas":[33.277373,32.386557,-97.530442,-96.398095],
                "Houston":[29.760427,29.099097,-95.36327,-94.936891],
                "SanAntonio":[29.590767, 29.249684, -98.679199, -98.275590],
                "Seattle":[47.734375,47.30957,-122.453613,-122.148438],
                 "SanDiego":[33.277373,32.386557,-117.530442,-116.398095],
                 "ElPaso":[31.999512,31.332397,-106.699219,-106.000977],
                 "LosAngeles":[34.277373,33.386557,-118.530442,-117.398095],
                 "Riverside":[34.277373,33.386557,-117.530442,-116.398095],
            };

            rawwData = [];

            for(city in cities) {
                let latlng = cities[city];
                let jsonUrl = 'https://api.purpleair.com/v1/sensors?api_key=81D9ACDC-966F-11EC-B9BF-42010A800003&nwlat=' + 
                latlng[0] + '&selat=' + latlng[1] + '&nwlng=' + latlng[2] + '&selng=' + latlng[3] + '&fields=latitude,longitude,altitude,pm2.5_10minute';
                let response = await fetch(jsonUrl);
                let currentData = await response.json();

                rawwData = rawwData.concat(currentData.data);
            }
            airData = rawwData;

            console.log(airData);

        }



        for (let i = 0; i < airData.length; i++) {
            let data = airData[i];
            let sensorKey = data[0];
            let longNLatArray = [data[1], data[2]]; //fetched like [index,long,lat,alt,pm25]...
            var pm10Mins = data[4];
            let colorNDes = getPMDescription(pm10Mins)
            var color = colorNDes[0];
            var description = colorNDes[1];

            var c = ' marker-cluster-';
            if (color == "#00e400") {
                c += 'small';
            } else if (color == "#fdff01") {
                c += 'medium';
            } else {
                c += 'large';
            }
            
            var circleMarker = new L.marker([longNLatArray[0], longNLatArray[1]],
            { 
                icon: L.divIcon({
                    html: '<div><span><b>' + pm10Mins + '</b></span></div>',
                    className: 'marker-cluster' + c, 
                    iconSize: new L.Point(40, 40)
                }),
                title:pm10Mins,
             });

            circleMarker.bindPopup("<div id=" + sensorKey + " >", {
                maxWidth : 201,
                minWidth: 201
            });;

            markers.addLayer(circleMarker);
            purpleAirMonitors.addLayer(circleMarker);

            let airApiUrl = 'https://api.purpleair.com/v1/sensors/' + sensorKey + '?api_key=81D9ACDC-966F-11EC-B9BF-42010A800003';

            //console.log(airApiUrl);
            // Hit URL when user clicks on marker
            circleMarker.on('click', async function (e) {
                
                console.log("clicked on marker " + sensorKey)

                let response = await fetch(airApiUrl);
                let popupData = await response.json();
                popupData = popupData.sensor;

                buildAirDataPopup(circleMarker, popupData, description);
                // Check if marker has popup
                // if (circleMarker.getPopup()) {
                //     // If it does, close it
                //     circleMarker.closePopup();
                // } else {
                //     // If it doesn't, open it
                //     circleMarker.openPopup();
                // }

            });

        }




    }

    function addMore() {
        console.log("hey")
        var moreButton = document.getElementById("moreButton");
        
        if(moreButton.textContent == "More...") {
        document.getElementById("more").style.display = "block";
        document.getElementById("moreButton").textContent = "Less...";
        } else {
        document.getElementById("more").style.display = "none";
        document.getElementById("moreButton").textContent = "More...";
        }
        //airMarkerPopup += `<a href="#">More...</a>`
    }

    function buildAirDataPopup(marker, popupData, description) {
        // console.log(popupData);

        var sensorKey = popupData.sensor_index; //sensor index

        let unixTimestamp = popupData.last_modified;
        var a = new Date(unixTimestamp * 1000);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var time = month + ' ' + date + ', ' + year;

        var airMarkerPopup = `
        <span>
        <div style="
            font-size: xxx-large;
            font-family: sans-serif;
            text-align: center;
            border-color: green;
            border-radius: 20px;
            color: black;
        ">${popupData.stats["pm2.5_10minute"]}
        </div>
        <b>
        ${description} 
        `;

        // insert bold ending brace at end of colon
        //airMarkerPopup.replace(":", ":</b>");
        // Get length of Pm2.5_10minute
        var pmLength = popupData.stats["pm2.5_10minute"].toString().length;

        airMarkerPopup += `
        <span style="
            font-size: small;
            color: grey;
            position: absolute;
            top: 50px;
            right: 10px;
        "> μg/m <sup>3</sup>
        </span>`

        airMarkerPopup += `</div>`;

        airMarkerPopup += buildAirTable(popupData.stats);

        airMarkerPopup += `<a id="moreButton" href="#" onclick="addMore()">More...</a>`

        airMarkerPopup += `<div id="more" style="display:none">
        <div class="air-info">
        <span><b>Time:</b> ${time} </span><BR>
        <span><b>Latitude:</b> ${popupData.latitude} </span><BR>
        <span><b>Longitude:</b> ${popupData.longitude} </span><BR>
        <span><b>Altitude:</b> ${popupData.altitude} </span><BR>
        </div>
        `;

        console.log(airMarkerPopup);

        // Clear the current click event
        //marker.on('click', function (e) {});

        //marker.bindPopup(airMarkerPopup, {
        //    maxWidth : 201
        //});;
        document.getElementById(sensorKey).innerHTML = airMarkerPopup;
        console.log("got far")
        //marker.openPopup();
        //if (marker.getPopup())
        //    console.log("got popup")
        // No marker is popping up, fix this
        // marker.on('click', function (e) {
        //     console.log("clicked on marker " + sensorKey)
        //     // Check if marker has popup
        //     if (marker.getPopup()) {
        //         // If it does, close it
        //         marker.closePopup();

    }

    // build air table for next 5 hours
    function buildAirTable(pmData) {
        // console.log(pmData);
        var data = `
                <tr>
                    <td>${pmData["pm2.5"]}</td>
                    <td>${pmData["pm2.5_10minute"]}</td>
                    <td>${pmData["pm2.5_30minute"]}</td>
                    <td>${pmData["pm2.5_60minute"]}</td>
                    <td>${pmData["pm2.5_6hour"]}</td>
                    <td>${pmData["pm2.5_24hour"]}</td>
                    <td>${pmData["pm2.5_1week"]}</td>
                </tr>
                `;


        var table = `
        <table style="
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 0.9em;
        font-family: sans-serif;
        min-width: 210px;
        min-height: 30px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
    ">
        <thead style="
        text-align: center;
        padding: 10px 40px;
        font-size: smaller;
        background-color: #009375;
        color: #ffffff;
        text-align: center;
    ">
            <tr>
                <th>Now</th>
                <th>10 Min</th>
                <th>30 Min</th>
                <th>1 hr</th>
                <th>6 hr</th>
                <th>1 Day</th>
                <th>1 Week</th>
            </tr>
        <thead>
        <tbody>
            ${data}
        </tbody>
        <table/>
        `;
        return table;
    }

    function getPMDescription(pm10Mins, AQI = false) {
        let description = "";
        let color = "";
        if ((AQI && pm10Mins <= 50) || pm10Mins <= 12) {
            color = '#00e400';
            description = '<span>0-12: Air quality is satisfactory, and air pollution poses little or no risk with 24 hours of exposure.</span><BR>';
        } else if ((AQI && pm10Mins <= 100) || pm10Mins <= 35) {
            color = '#fdff01';
            description = '<span>12.1-35.4: Air quality is acceptable. However, there may be a risk for some people with 24 hours of exposure, particularly those who are unusually sensitive to air pollution.</span><BR>';
        } else if ((AQI && pm10Mins <= 150) || pm10Mins <= 55) {
            color = '#ff7e01';
            description = '<span>35.5-55.4: Members of sensitive groups may experience health effects. The general public is less likely to be affected.</span><BR>';
        } else if ((AQI && pm10Mins <= 200) || pm10Mins <= 150) {
            color = '#ff0100';
            description = '<span>55.5-150.4: Some members of the general public may experience health effects: members of sensitive groups may experience more serious health effects.</span><BR>';
        } else if ((AQI && pm10Mins <= 300) || pm10Mins <= 250) {
            color = '#8f3f97';
            description = '<span>150.5-250.4: Health Alert: The risk of health effects is increased for everyone.</span><BR>';

        } else if ((AQI && pm10Mins <= 301) || pm10Mins <= 350) {
            color = '#7e0023';
            description = '<span>250.5-350.4: Health Warning: Health warning of emergency conditions: everyone is more likely to be affected.</span><BR>';

        } else {
            color = '#7e0023';
            description = '<span>>=350.5: Health Warning: Health warning of emergency conditions: everyone is more likely to be affected.</span><BR>';

        }
        return [color, description];
    }

    async function mapMicrosoftAirData(map) {

        if(runGetMicrosoftAirOnce) {
            return;
        }
        runGetMicrosoftAirOnce = true;

        let microsoftSerialNumber = [
            {
                serial_number: 2032,
                latitude: 30.389722,
                longtitude: -97.726278,
                owned: 'TACC',
            },
            {
                serial_number: 2028,
                latitude: 30.28463302,
                longtitude: -97.7409172,
                owned: 'UIL',
            },
            {
                serial_number: 2031,
                latitude: 30.35748,
                longtitude: -97.76211,
                owned: 'COA',
            },
            {
                serial_number: 2029,
                latitude: 30.357686,
                longtitude: -97.762113,
                owned: 'COA',
            },
        ];

        let addedSerialNumber = new Set();

        let airApiUrl = 'https://eclipseprowebapi.azurewebsites.net/EclipseData/GetEclipseData?CustomerName=Austin&RecentNHours=1';
        let response = await fetch(airApiUrl);
        let microData = await response.json();
        let selectedData = [];

        for (let i = 0; i < microData.length; i++) {
            let deviceNum = parseInt(microData[i].MSRDeviceNbr);
            for (let j = 0; j < microsoftSerialNumber.length; j++) {
                let dp = microsoftSerialNumber[j];
                let serial_number = dp.serial_number;
                if (serial_number === deviceNum && !addedSerialNumber.has(serial_number)) {
                    microData[i]['Longitude'] = dp.longtitude;
                    microData[i]['Latitude'] = dp.latitude;
                    selectedData.push(microData[i]);
                    addedSerialNumber.add(serial_number);
                }
            }

        }

        //map 
        for (let i = 0; i < selectedData.length; i++) {
            popupData = selectedData[i];

            var pm10Mins = popupData["PM10"];
            let colorNDes = getPMDescription(pm10Mins, true);
            var color = colorNDes[0];
            // var description = colorNDes[1];
            var description = "";



            /*var circleMarker = L.circleMarker([popupData.Latitude, popupData.Longitude], {
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                radius: 15,
            }).addTo(map);
            var circleMarker = L.marker([popupData.Latitude, popupData.Longitude], {
                icon: L.divIcon({
                    className: 'my-custom-icon',
                    html: (Math.round(pm10Mins * 100) / 100).toFixed(2),
                }),
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                radius: 15,
            }).addTo(map);  */


            var c = ' marker-cluster-';
            if (color == "#00e400") {
                c += 'small';
            } else if (color == "#fdff01") {
                c += 'medium';
            } else {
                c += 'large';
            }

            var circleMarker = new L.marker([popupData.Latitude, popupData.Longitude],
                { 
                    icon: L.divIcon({
                        html: '<div><span><b>' + (Math.round(pm10Mins * 100) / 100).toFixed(2) + '</b></span></div>',
                        className: 'marker-cluster' + c, 
                        iconSize: new L.Point(40, 40)
                    }),
                    title:pm10Mins,
                 });

            markers.addLayer(circleMarker);
            microsoftAirMonitors.addLayer(circleMarker);


            buildMicrosoftAirDataPopup(circleMarker, popupData, description);
        }
    }
    function buildMicrosoftAirDataPopup(marker, popupData, description) {
        // console.log(popupData);

        let datetime = popupData.ReadingDateTimeLocal;

        
        var airMarkerPopup = `
            <div class="air-info">
            <span>Time: ${datetime} </span><BR>
            <span>Latitude: ${popupData.Latitude} </span><BR>
            <span>Longitude: ${popupData.Longitude} </span><BR>
            <span>Temperture: ${(Math.round(popupData.TempC * 100) / 100).toFixed(2)} </span><BR>
            <span>Humidity: ${(Math.round(popupData.Humidity * 100) / 100).toFixed(2)} </span><BR>


        `;
        airMarkerPopup += `
                <span>AQI: ${(Math.round(popupData.PM10 * 100) / 100).toFixed(2)} </span><BR>
                <span>AQI Label: ${popupData.AQILabel} </span><BR>

                ${description}
        `;

        airMarkerPopup += `</div>`;

        airMarkerPopup += buildMicrosoftAirTable(popupData);
        marker.bindPopup(airMarkerPopup);
    }

    function buildMicrosoftAirTable(pmData) {
        // console.log((Math.round(pmData["PM10"] * 100) / 100).toFixed(2));
        var data = `
                <tr>
                    <td>${(Math.round(pmData["PM1"] * 100) / 100).toFixed(2)}</td>
                    <td>${(Math.round(pmData["PM10"] * 100) / 100).toFixed(2)}</td>
                    <td>${(Math.round(pmData["PM25"] * 100) / 100).toFixed(2)}</td>
                </tr>
                `;


        var table = `
        <table>
        <thead>
            <tr>
                <th>PM 1</th>
                <th>PM 2.5</th>
                <th>PM 10</th>
            </tr>
        <thead>
        <tbody>
            ${data}
        </tbody>
        <table/>
        `;
        return table;
    }

    var poiMarkers = [];

    function buildPOIMap() {

        // Delete all markers
        for (var i = 0; i < poiMarkers.length; i++) {
            poiMarkers[i].remove();
        }

        var fireDept = document.querySelector(".firedept").checked;
        var policeDept = document.querySelector(".policedept").checked;
        var hospital = document.querySelector(".hospital").checked;


        console.log("POI radio button clicked");
        // display csv file from POI.csv
        var filePath = '../data/POI.csv';
        var result;
        fetch(filePath)
            .then(response => {
            return response.text();
        })
        .then(data => {
            result = data;
            var lines = result.replace("\\", "").replace("\\\r","").split('\n');
            var headers = lines[0].split(',');
            var jsonResult = [];
            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].split(',');
                var valid = true;
                for (var j = 0; j < headers.length; j++) {
                    if (currentline[j] == undefined) 
                        valid = false;
                    obj[headers[j]] = currentline[j];
                }
                if (valid) 
                jsonResult.push(obj);
            }
            //console.log(jsonResult);
            for (var i = 0; i < jsonResult.length; i++) {
                console.log(jsonResult[i]);

                var iconLink = "assets/images/firedept.png";
                var type = "Fire";
                if(jsonResult[i]["Jurisdiction Name"] == "APD") {
                    iconLink = "assets/images/policedept.png";
                    type = "Police";
                }
                else if(jsonResult[i]["Jurisdiction Name"] == "AHD") {
                    iconLink = "assets/images/hospital.png";
                    type = "Medical";
                }

                console.log("Type: " + type);

                // Perform checkbox booleans
                if(!fireDept && !policeDept && !hospital)
                    continue
                else if(!fireDept && !policeDept && hospital && type != "Medical")
                    continue
                else if(!fireDept && policeDept && !hospital && type != "Police")
                    continue
                else if(!fireDept && policeDept && hospital && type != "Police" && type != "Medical")
                    continue
                else if(fireDept && !policeDept && !hospital && type != "Fire")
                    continue
                else if(fireDept && !policeDept && hospital && type != "Fire" && type != "Medical")
                    continue
                else if(fireDept && policeDept && !hospital && type != "Fire" && type != "Police")
                    continue
                else if(fireDept && policeDept && hospital && type != "Fire" && type != "Police" && type != "Medical")
                    continue
                

                var marker = L.marker([jsonResult[i].Y, jsonResult[i].X]).addTo(map);
                // Change the icon to a custom icon
                marker.setIcon(L.icon({
                    iconUrl: iconLink,
                    iconSize: [70, 70],
                    iconAnchor: [10, 10],
                    popupAnchor: [25, -10]
                }));

                marker.bindPopup( type + " Station: " + jsonResult[i].Name);

                // store marker in array to be deleted later
                poiMarkers.push(marker);
                
            }
        });
    }

    function buildDropdownMenu(map) {
        var checkList = document.getElementById('filter-menu');
        checkList.getElementsByClassName('anchor')[0].onclick = function (evt) {
            if (checkList.classList.contains('visible'))
                checkList.classList.remove('visible');
            else
                checkList.classList.add('visible');
        }
        // add event listener
        var checkboxActiveFire = document.querySelector(".active-fire");
        checkboxActiveFire.addEventListener('click', function () {
            buildStatusToggleButton(map, checkboxActiveFire);
        });

        document.querySelector(".firedept").addEventListener('click', function () {
            buildPOIMap();
        });

        document.querySelector(".policedept").addEventListener('click', function () {
            buildPOIMap();
        });

        document.querySelector(".hospital").addEventListener('click', function () {
            buildPOIMap();
        });

        var checkboxOneSmoke = document.querySelector(".one-hour-smoke");
        var checkboxTwoSmoke = document.querySelector(".two-hour-smoke");
        var checkboxThreeSmoke = document.querySelector(".three-hour-smoke");

        checkboxOneSmoke.addEventListener('click', function () {
            changeSmokeForecast(checkboxOneSmoke, onehourForecastGroup);
        });
        checkboxTwoSmoke.addEventListener('click', function () {
            changeSmokeForecast(checkboxTwoSmoke, twohourForecastGroup);
        });
        checkboxThreeSmoke.addEventListener('click', function () {
            changeSmokeForecast(checkboxThreeSmoke, threehourForecastGroup);
        });

        function changeSmokeForecast(checkbox, forecastGroup) {
            // Clear other smoke forecast layers,
            // add relevant KML for current forecast
            if (checkbox.checked) {
                map.removeLayer(onehourForecastGroup);
                map.removeLayer(twohourForecastGroup);
                map.removeLayer(threehourForecastGroup);
                checkboxOneSmoke.checked = false;
                checkboxTwoSmoke.checked = false;
                checkboxThreeSmoke.checked = false;
                checkbox.checked = true;
                forecastGroup.addTo(map);
            } else {
                map.removeLayer(forecastGroup);
            }
        }

        changeSmokeForecast(checkboxOneSmoke, onehourForecastGroup);

        /*var checkLocation = document.querySelector(".option2");
        checkLocation.addEventListener('click', function () {
            console.log("Checking location");
            getUserLocation();
        }); */

        var checkboxPurpleAir = document.querySelector(".purple-air");
        checkboxPurpleAir.addEventListener('click', function () {
            if (checkboxPurpleAir.checked) {
                purple_air_diaplay_flag = true
                if(microsoft_air_display_flag) {
                    map.removeLayer(purpleAirMonitors)
                    map.removeLayer(microsoftAirMonitors)
                    map.addLayer(markers)
                }
                else 
                    map.addLayer(purpleAirMonitors)
            } else {
                purple_air_diaplay_flag = false
                if(microsoft_air_display_flag) {
                    map.removeLayer(markers)
                    map.addLayer(microsoftAirMonitors)
                }
                else 
                    map.removeLayer(purpleAirMonitors)
            }
            // console.log(purple_air_diaplay_flag);
            // clear all markers and rebuild map layer
            /*map.eachLayer(function (layer) {
                map.removeLayer(layer);
            });
            addMapLayer(map);
            mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
        */

        });

        var checkboxMicrosoftAir = document.querySelector(".microsoft-air");
        checkboxMicrosoftAir.addEventListener('click', function () {
            if (checkboxMicrosoftAir.checked) {
                microsoft_air_display_flag = true
                if(purple_air_diaplay_flag) {
                    map.removeLayer(microsoftAirMonitors)
                    map.removeLayer(purpleAirMonitors)
                    map.addLayer(markers)
                }
                else
                    map.addLayer(microsoftAirMonitors)
            } else {
                microsoft_air_display_flag = false
                if(purple_air_diaplay_flag) {
                    map.removeLayer(markers)
                    map.addLayer(purpleAirMonitors)
                }
                else
                    map.removeLayer(microsoftAirMonitors)
            }
            // clear all markers and rebuild map layer
            /*map.eachLayer(function (layer) {
                map.removeLayer(layer);
            });
            addMapLayer(map);
            mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
        */

        });
    }

    function addShapefileRadioListener(map) {
        var radios = document.getElementsByName('shapefile-radio');
        for (var i = 0, max = radios.length; i < max; i++) {
            radios[i].onclick = function () {
                shapefile_display_flag = this.value;
                // console.log(shapefile_display_flag)
                // clear all markers and rebuild map layer
                /*map.eachLayer(function (layer) {
                    map.removeLayer(layer);
                });
                addMapLayer(map);
                mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
                */
               if(currentShapefile != null) 
                    map.removeLayer(currentShapefile)
                buildShapefile(map, shapefile_display_flag)

                var checkboxOneSmoke = document.querySelector(".one-hour-smoke");
                var checkboxTwoSmoke = document.querySelector(".two-hour-smoke");
                var checkboxThreeSmoke = document.querySelector(".three-hour-smoke");
                checkboxOneSmoke.checked = false;
                checkboxOneSmoke.checked = true;
                checkboxOneSmoke.dispatchEvent(new Event('click'));
                checkboxTwoSmoke.checked = false;
                checkboxThreeSmoke.checked = false;
            }
        }
    }


    var data = "<item><title>Traffic Injury Pri 4F</title>" +
        "<link>http://maps.google.com/maps?q=30.389258,-97.745772</link>" +
        "<description>9800-9832 RESEARCH BLVD SVRD SB | AFD | 16:12:50</description>" +
        "<pubDate>Mon, 06 Dec 2021 16:12:50 CDT</pubDate></item>";

    // initialize map and base layer
    var map = L.map('map',{ preferCanvas:true, zoomControl: false, renderer: L.canvas() }).setView([30.356635, -97.701180], 12);

    new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

    let inactive_flag = true;
    let purple_air_diaplay_flag = true;
    let microsoft_air_display_flag = true;

    addMapLayer(map);

    // map today's dp
    let dateArray = [];
    var airData = [];
    var today = new Date();
    var date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + today.getDate()).slice(-2);
    dateArray.push(date);
    let shapefile_display_flag = "fire-risk-radio";
    mapFireIncident(map, dateArray, inactive_flag, shapefile_display_flag, purple_air_diaplay_flag, microsoft_air_display_flag);
    addShapefileRadioListener(map);
    buildSelectBar(map);
    buildDropdownMenu(map);

    // add clusters

    map._layersMaxZoom = 19;




    // add zostera legend
    L.control.legend({
        position: 'bottomleft',
        items: [
            {color: 'white', label: '<b>Fire Risk</b>'},
            {color: 'red', label: 'Highest'},
            {color: 'orange', label: 'Elevated'},
            {color: 'yellow', label: 'Low'},
            {color: 'white', label: ''},
            {color: 'white', label: '<b>Smoke Levels</b>'},
            {color: '#9cd74e', label: 'Good'},
            {color: '#facf39', label: 'Moderate'},
            {color: '#f68f47', label: 'Unhealthy for Sensitive Groups'},
            {color: '#f55e5f', label: 'Unhealthy'},
            {color: '#a070b5', label: 'Very Unhealthy'},
            {color: '#a06a7b', label: 'Hazardous'},
        ],
        collapsed: true,
        // insert different label for the collapsed legend button.
        buttonHtml: 'Legend'
    }).addTo(map);

    document.getElementsByClassName("leaflet-left")[1].style.left = "5px"
    document.getElementsByClassName("leaflet-legend-list")[0].style = "text-align: left;"

    // add geolocator for address
    //const provider = new GeoSearch.OpenStreetMapProvider();

    //const search = new GeoSearch.GeoSearchControl({
    //    provider: new GeoSearch.OpenStreetMapProvider(),
    //});
    //map.addControl(search);

    // create the geocoding control and add it to the map
    var searchControl = L.esri.Geocoding.geosearch({
        position: 'topright',
        placeholder: 'Enter an address or place e.g. 1 York St',
        providers: [
        L.esri.Geocoding.arcgisOnlineProvider({
            // API Key to be passed to the ArcGIS Online Geocoding Service
            apikey: 'AAPK88fbee9b41364fc28314cabcb5108702X4OOHT6TEoflnY2xPNIuDPA8zi_zSGHg0weTJJzjiOFWugapHwRA5DvZw7Uht0eR'
        })
        ]
    }).addTo(map);


    //document.getElementsByClassName("geocoder-control")[0].children[0].style = "background-color: transparent; border-color: transparent; background-image:url(assets/images/search.png);"
    //document.getElementsByClassName("geocoder-control")[0].style = "position: fixed;top: 2.5px;right: -4.5px;"

    console.log(searchControl)

    // create an empty layer group to store the results and add it to the map
    var results = L.layerGroup().addTo(map);

    // listen for the results event and add every result to the map
    searchControl.on("results", function (data) {
        foundLocationGeocoded(data);
    });

    // Get user location and display on map


  L.Control.Watermark = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div');
        container.type="button";
        container.title="No cat";
        container.value = "42";
        container.classList = ["geocoder-control leaflet-control"]
    
        /*container.style.backgroundColor = 'white';     
        //container.style.backgroundImage = "url(https://t1.gstatic.com/images?q=tbn:ANd9GcR6FCUMW5bPn8C4PbKak2BJQQsmC-K9-mbYBeFZm1ZM2w2GRy40Ew)";
        container.style.backgroundSize = "30px 30px";
        container.style.width = '30px';
        container.style.height = '30px'; 
        
        container.onmouseover = function(){
          container.style.backgroundColor = 'pink'; 
        }
        container.onmouseout = function(){
          container.style.backgroundColor = 'white'; 
        } */
    
        container.onclick = function(){
          getUserLocation();
        }
    
        container.innerHTML = `
        <div class=\"geocoder-control-input leaflet-bar\" title=\"Check My Location\" style=\"position:absolute;top:0px; background-image: url(https://smartcity.tacc.utexas.edu/FireIncident/assets/images/location.png)\"></div><div class=\"geocoder-control-suggestions leaflet-bar\"><div class=\"\"></div></div>\r\n
        `;

        return container;
      },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}

L.control.watermark({ position: 'bottomright' }).addTo(map);


L.Control.Watermark = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div');
        container.type="button";
        container.title="No cat";
        container.value = "42";
        container.classList = ["geocoder-control leaflet-control"]
    
        /*container.style.backgroundColor = 'white';     
        //container.style.backgroundImage = "url(https://t1.gstatic.com/images?q=tbn:ANd9GcR6FCUMW5bPn8C4PbKak2BJQQsmC-K9-mbYBeFZm1ZM2w2GRy40Ew)";
        container.style.backgroundSize = "30px 30px";
        container.style.width = '30px';
        container.style.height = '30px'; 
        
        container.onmouseover = function(){
          container.style.backgroundColor = 'pink'; 
        }
        container.onmouseout = function(){
          container.style.backgroundColor = 'white'; 
        } */
    
        container.onclick = function() {
            stats();
        };
    
        container.innerHTML = `
        <div class=\"geocoder-control-input leaflet-bar\" title=\"Stats\" style=\"    

        background-image: url(); width:35px; \"><img src="https://smartcity.tacc.utexas.edu/FireIncident/assets/images/stats1.png" style="width: 20px;height: 20px;position: absolute;left: 5px;"></div><div class=\"geocoder-control-suggestions leaflet-bar\"><div class=\"\"></div></div>\r\n
        `;

        return container;
      },

    onRemove: function(map) {
        // Nothing to do here
    }
});

/*
L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}


L.control.watermark({ position: 'bottomright' }).addTo(map);
*/
//document.getElementsByClassName("geocoder-control")[0].style = "position:fixed;width: 10px;top: 2.5px;right: 29.5px;"


L.Control.Watermark = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div');
        container.type="button";
        container.title="No cat";
        container.value = "42";
        container.classList = ["geocoder-control leaflet-control"]
    
        /*container.style.backgroundColor = 'white';     
        //container.style.backgroundImage = "url(https://t1.gstatic.com/images?q=tbn:ANd9GcR6FCUMW5bPn8C4PbKak2BJQQsmC-K9-mbYBeFZm1ZM2w2GRy40Ew)";
        container.style.backgroundSize = "30px 30px";
        container.style.width = '30px';
        container.style.height = '30px'; 
        
        container.onmouseover = function(){
          container.style.backgroundColor = 'pink'; 
        }
        container.onmouseout = function(){
          container.style.backgroundColor = 'white'; 
        } */
    
        //container.onclick = function() {
         //   stats();
        //};
    
        container.innerHTML = `
        <div class=\"dropdown-check-list geocoder-control-input leaflet-bar\" title=\"Layers\" style=\"    background-color: transparent;
        border-color: transparent; background-image: url(); width:35px; \"><img src="assets/images/layers.png" style="width: 20px;height: 20px;position: absolute;left: 5px;"></div><div class=\"geocoder-control-suggestions leaflet-bar\"><div class=\"\"></div></div>\r\n
        `;

        return container;
      },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}


L.control.watermark({ position: 'bottomright' }).addTo(map);

//document.getElementsByClassName("geocoder-control")[0].style = "position:fixed;width: 10px;top: 2.5px;right: 67.5px;"


    var spinner = document.getElementById('spinner');
    spinner.style.display = 'none';

    document.getElementsByClassName( 'leaflet-control-attribution' )[0].style.display = 'none';



    //buildWeeklyLineChart();
    //buildWeeklyColumnChart();
    //buildPerHourBoxChart();

    fetch('../data/AverageFire.json').then(response => {
        // Replace all instances of "NaN" with 0
        return response.text().then(text => text.replace(/NaN/g, 0));
        }).then(jsondata => {

        result = JSON.parse(jsondata)
        console.log(result)

        window.AverageFire = result;
    });

