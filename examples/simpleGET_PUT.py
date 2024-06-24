import requests
import time

def sendGETRequest(endpoint):
    # Store the API Address
    cameraAPIAddress = "http://Studio-Camera-6K-Pro.local/control/api/v1"    # Remember to change this for YOUR camera's API address

    # Send the request
    response = requests.get(cameraAPIAddress+endpoint)

    # Handle errors and return
    if (response.status_code < 300): 
        return response.json()
    else:
        return response
    
def sendPUTRequest(endpoint, data):
    # Store the API Address
    cameraAPIAddress = "http://Studio-Camera-6K-Pro.local/control/api/v1"    # Remember to change this for YOUR camera's API address

    # Send the request
    response = requests.put(cameraAPIAddress+endpoint, json=data)

    # Handle errors and return
    return response

def toggleRecord(filename=""):
    # First, get whether or not the camera is recording right now
    recordingState = sendGETRequest("/transports/0/record")

    # Boolean invert the recording state
    recordingState["recording"] = not (recordingState["recording"])

    # If a file name was specified, add that to the dict as "clipName"
    if (len(filename) > 0):
        recordingState["clipName"] = filename

    # PUT the data back on the camera
    sendPUTRequest("/transports/0/record",recordingState)