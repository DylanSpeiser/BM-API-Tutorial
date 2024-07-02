// This is the version of BMDevice WITH WebSocket functionality

class BMDevice {
    // Keep track of the device's hostname and API address
    hostname;
    APIAddress;

    // WebSocket items
    ws;
    availableProperties;
    propertyData = {};

    // Reference to UI Updating callback function
    updateUI() {};

    // Constructor takes hostname as an argument and sets the
    // hostname and APIAddress fields accordingly. It also initializes
    // the WebSocket.
    constructor(hostname) {
        // Initialize Names
        this.hostname = hostname;
        this.APIAddress = "http://"+hostname+"/control/api/v1";

        // Initialize WebSocket
        this.ws = new WebSocket("ws://"+hostname+"/control/api/v1/event/websocket");

        // Get a self object for accessing within callback fns
        var self = this;

        // Set the onmessage behavior
        this.ws.onmessage = (event) => {
            // Parse the event's data as JSON
            let eventData = JSON.parse(event.data);

            // Extract data we really care about
            let messageData = eventData.data;

            // If it's a listProperties message, update the available properties array
            if (messageData.action == "listProperties") {
                self.availableProperties = messageData.properties;
            }

            // If we get a response from the camera with property information, save it.
            if (eventData.type == "response") {
                Object.assign(this.propertyData, messageData.values);
            }

            // If it's a propertyValueChanged event, update the camera object accordingly and show it on the web page.
            if (messageData.action == "propertyValueChanged") {
                this.propertyData[messageData.property] = messageData.value;
            }

            // Update the UI
            this.updateUI();

            // Output info to console.
            console.log("WebSocket message received: ", eventData);
        }

        // Wait for the WebSocket to open
        this.ws.onopen = (event) => {
            // Once the WebSocket is open,

            // Ask it for all the properties
            self.ws.send(JSON.stringify({type: "request", data: {action: "listProperties"}}));

            sleep(100).then(() => {
                // Subscribe to all available events
                this.availableProperties.forEach((str) => {
                    self.ws.send(JSON.stringify({type: "request", data: {action: "subscribe", properties: [str]}}));
                });
            });
        }
    }

    // Returns a JSON Object of data we got from the device
    GETdata(endpoint) {
        // Instantiate the XMLHttpRequest object
        let xhr = new XMLHttpRequest();
    
        // Create an object to store and return the response
        var responseObject = {};
    
        // Define the onload function
        xhr.onload = function() {
            if (this.status < 300) {                            // If the operation is successful
                if (this.responseText) {
                    responseObject = JSON.parse(this.responseText);     // Give the data to the responseObject
                }
                responseObject.status = this.status;                // Also pass along the status code for error handling
            } else {                                            // If there has been an error
                responseObject = this;                              // Give the XMLHttpRequest data to the responseObject
                console.error("Error ", this.status, ": ", this.statusText);    // Log the error in the console
            }
        };
    
        // Open the connection
        // The "false" here specifies that we want to wait for the response to come back before returning from xhr.send()
        xhr.open("GET", this.APIAddress+endpoint, false);
    
        // Send the request
        xhr.send();
    
        // Return the data
        return responseObject;
    }

    // Send JSON Object data to the device
    PUTdata(endpoint, data) {
        // Instantiate the XMLHttpRequest object
        let xhr = new XMLHttpRequest();
    
        // Create an object to store and return the response
        var responseObject = {};
    
        // Define the onload function
        xhr.onload = function() {
            if (this.status < 300) {                            // If the operation is successful
                if (this.responseText)
                    responseObject = JSON.parse(this.responseText);     // Give the data to the responseObject
                responseObject.status = this.status;                // Also pass along the status code for error handling
            } else {                                            // If there has been an error
                responseObject = this;                              // Give the XMLHttpRequest data to the responseObject
                console.error("Error ", this.status, ": ", this.statusText);    // Log the error in the console
            }
        };
    
        // Open the connection
        // The "false" here specifies that we want to wait for the response to come back before returning from xhr.send()
        xhr.open("PUT", this.APIAddress+endpoint, false);
    
        // Send the request with data
        xhr.send(JSON.stringify(data));
    
        // Return response data
        return responseObject;
    }

    // Send request with other method type
    sendRequest(method, endpoint, data) {
        // Instantiate the XMLHttpRequest object
        let xhr = new XMLHttpRequest();
    
        // Create an object to store and return the response
        var responseObject = {};
    
        // Define the onload function
        xhr.onload = function() {
            if (this.status < 300) {                            // If the operation is successful
                if (this.responseText)
                    responseObject = JSON.parse(this.responseText);     // Give the data to the responseObject
                responseObject.status = this.status;                // Also pass along the status code for error handling
            } else {                                            // If there has been an error
                responseObject = this;                              // Give the XMLHttpRequest data to the responseObject
                console.error("Error ", this.status, ": ", this.statusText);    // Log the error in the console
            }
        };
    
        // Open the connection
        // The "false" here specifies that we want to wait for the response to come back before returning from xhr.send()
        xhr.open(method, this.APIAddress+endpoint, false);
    
        // Send the request with data
        xhr.send(JSON.stringify(data));
    
        // Return response data
        return responseObject;
    }

    // Uses the endpoints from calling "/event/list" to populate the object with data
    // Not all data is included, such as anything from the "/video" endpoints, but much of it is.
    GETdataFromEventList() {
        // The "/event/list" endpoint will return an array of endpoints we can query for their status
        var eventStrings = this.GETdata("/event/list");

        // For each of the strings, set the corresponding field in this object to the device's current status for that field
        eventStrings.forEach((str) => {
            // Get data from the device
            var responseData = this.GETdata(str);

            // Remove the "status" key from the response
            delete responseData["status"];

            // Set corresponding field
            this[str] = responseData;
        });
    }

    // This function will make the device record
    // If the optional parameter is set to false, it will stop recording 
    record(state = true) {
        this.PUTdata("/transports/0/record",{recording: state});
    }

    // This function rebuilds the playback timeline from the current
    // recording media.
    rebuildTimeline() {
        let activeMedia = this.GETdata("/media/active");

        this.PUTdata("/media/active", {workingsetIndex: activeMedia.workingsetIndex});
    }

    // This function formats the media drive at the given index in the device's working set
    formatDrive(index, newVolumeName) {
        // Fetch the device's working set
        let workingSet = this.GETdata("/media/workingset").workingset;

        // Get the format key for the indicated drive
        let formatKey = this.GETdata("/media/devices/"+workingSet[index].deviceName+"/doformat").key;

        // Here, I'm assuming that the drive is able to be formatted as ExFAT.
        // Run this command and pick another option if that's not the case:

        // let supportedFilesystems = this.GETdata("/media/devices/doformatSupportedFilesystems");

        // Format the drive
        this.PUTdata("/media/devices/"+workingSet[index].deviceName+"/doformat",{key: formatKey, volume: newVolumeName, filesystem: "ExFAT"})
    }
}

class BMCamera extends BMDevice {
    // Child class constructor
    // Just passing the hostname to the superclass's constructor
    constructor(hostname) {
        super(hostname);
    }

    // Sets the white balance and tint based on the following preset:
    // 0: Sunlight, 1: Tungsten, 2: Fluorescent, 3: Shade, 4: Cloudy
    // Any other value will not affect the WB setting
    setWhiteBalancePreset(presetIndex) {
        var newWhiteBalance;
        var newWhiteBalanceTint;
        
        switch (presetIndex) {
            case 0:
                // Sunlight
                newWhiteBalance = 5600;
                newWhiteBalanceTint = 10;
                break;
            case 1:
                // Tungsten
                newWhiteBalance = 3200;
                newWhiteBalanceTint = 0;
                break;
            case 2:
                // Fluorescent
                newWhiteBalance = 4000;
                newWhiteBalanceTint = 15;
                break;
            case 3:
                // Shade
                newWhiteBalance = 4500;
                newWhiteBalanceTint = 15;
                break;
            case 4:
                // Cloudy
                newWhiteBalance = 6500;
                newWhiteBalanceTint = 10;
                break;
            default:
                // If any other value is set, don't change anything
                newWhiteBalance = this.GETdata("/video/whiteBalance").whiteBalance;
                newWhiteBalanceTint = this.GETdata("/video/whiteBalanceTint").whiteBalanceTint;
        }

        this.PUTdata("/video/whiteBalance",{whiteBalance: newWhiteBalance});
        this.PUTdata("/video/whiteBalanceTint",{whiteBalanceTint: newWhiteBalanceTint});
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}