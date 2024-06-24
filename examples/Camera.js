// Camera class to store our data and methods

class Camera {
    // Keep track of the camera's hostname and API address
    hostname;
    APIAddress;

    // Constructor takes hostname as an argument and sets the
    // hostname and APIAddress fields accordingly
    constructor(hostname) {
        this.hostname = hostname;
        this.APIAddress = "http://"+hostname+"/control/api/v1";
    }

    // Returns a JSON Object of data we got from the camera
    GETdata(endpoint) {
        // Instantiate the XMLHttpRequest object
        let xhr = new XMLHttpRequest();
    
        // Create an object to store and return the response
        var responseObject;
    
        // Define the onload function
        xhr.onload = function() {
            if (this.status < 300) {                            // If the operation is successful
                responseObject = JSON.parse(this.responseText);     // Give the data to the responseObject
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

    // Send JSON Object data to the camera
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

    // Uses the endpoints from calling "/event/list" to populate the object with data
    // Not all data is included, such as anything from the "/video" endpoints, but much of it is.
    GETdataFromEventList() {
        // The "/event/list" endpoint will return an array of endpoints we can query for their status
        var eventStrings = this.GETdata("/event/list");

        // For each of the strings, set the corresponding field in this object to the camera's current status for that field
        eventStrings.forEach((str) => {
            // Get data from the camera
            var responseData = this.GETdata(str);

            // Remove the "status" key from the response
            delete responseData["status"];

            // Set corresponding field
            this[str] = responseData;
        });
    }

    // This function will make the camera record
    // If the optional parameter is set to false, it will stop recording 
    record(state = true) {
        this.PUTdata("/transports/0/record",{recording: state});
    }
}