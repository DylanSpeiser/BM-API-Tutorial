function sendGETRequest(endpoint) {
    // Put the camera's API address in a constant
    const cameraAPIAddress = "http://studio-camera-6k-pro.local/control/api/v1";    // Remember to change this for YOUR camera's API address

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
    xhr.open("GET", cameraAPIAddress+endpoint, false);

    // Send the request
    xhr.send();

    // Return the data
    return responseObject;
}

function sendPUTRequest(endpoint, data) {
    // Put the camera's API address in a constant
    const cameraAPIAddress = "http://studio-camera-6k-pro.local/control/api/v1";    // Remember to change this for YOUR camera's API address

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
    xhr.open("PUT", cameraAPIAddress+endpoint, false);

    // Send the request with data
    xhr.send(data);

    // Return response data
    return responseObject;
}

function toggleRecord(filename="") {
    // First, get whether or not the camera is recording right now
    var recordingState = sendGETRequest("/transports/0/record");

    // Boolean invert the recording state
    recordingState.recording = !recordingState.recording;

    // If a file name was specified, add that to the dict as "clipName"
    if (filename) {
        recordingState.clipName = filename;
    }

    // PUT the data back on the camera
    sendPUTRequest("/transports/0/record",JSON.stringify(recordingState));
}