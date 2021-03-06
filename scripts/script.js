const APP_ID = "530e02bb27b840258e2da5fc229aa700";
const APP_TOKEN = "006530e02bb27b840258e2da5fc229aa700IAAVb2WmPCzqe+TzsBkaegiFzL8vnfUbvPYAz8oz5rnKoEOQEggAAAAAEAC5X9YGKrxiYAEAAQAnvGJg";
const CHANNEL_NAME = "myChannel";

// Handle errors.
let handleError = function (err) {
  console.log("Error: ", err);
};
let streamReference;
let defaultVolume = 50;

// Query the container to which the remote stream belong.
let remoteContainer = document.getElementById("remote-container");
let params = (new URL(document.location)).searchParams;
let role = params.get('role');

// Add video streams to the container.
function addVideoStream(elementId) {
  // Creates a new div for every stream
  let streamDiv = document.createElement("div");
  // Assigns the elementId to the div.
  streamDiv.id = elementId;
  streamDiv.classList.add("video-container");
  // Takes care of the lateral inversion
  streamDiv.style.transform = "rotateY(180deg)";
  // Adds the div to the container.
  remoteContainer.appendChild(streamDiv);
};

// Remove the video stream from the container.
function removeVideoStream(elementId) {
  let remoteDiv = document.getElementById(elementId);
  if (remoteDiv) remoteDiv.parentNode.removeChild(remoteDiv);
};

let client = AgoraRTC.createClient({
  mode: "live",
  codec: "vp8",
});

client.init(APP_ID);

// Join a channel
client.join(APP_TOKEN, CHANNEL_NAME, null, (uid) => {
  // Create a local stream
  let localStream = AgoraRTC.createStream({
    audio: true,
    video: true,
  });

  // Initialize the local stream
  localStream.init(() => {
    // Play the local stream
    localStream.play("me");
    // Publish the local stream
    client.publish(localStream, handleError);
    streamReference = localStream;

    if(role === "host") {
      client.setClientRole(role);
      streamReference.setVideoProfile("1080p_1");
    } else {
      client.setClientRole("audience");
      streamReference.setVideoProfile("240p_1");
    }
  },handleError);
},handleError);

// Subscribe to the remote stream when it is published
client.on("stream-added", function(evt){
  client.subscribe(evt.stream, handleError);
});
// Play the remote stream when it is subsribed
client.on("stream-subscribed", function(evt){
  let stream = evt.stream;
  let streamId = String(stream.getId());
  addVideoStream(streamId);
  stream.play(streamId);
});

// Remove the corresponding view when a remote user unpublishes.
client.on("stream-removed", function(evt){
  let stream = evt.stream;
  let streamId = String(stream.getId());
  stream.close();
  removeVideoStream(streamId);
});
// Remove the corresponding view when a remote user leaves the channel.
client.on("peer-leave", function(evt){
  let stream = evt.stream;
  let streamId = String(stream.getId());
  stream.close();
  removeVideoStream(streamId);
});

// volume down handler
document.getElementById("volume_mute")
  .addEventListener('click', function (event) {
    if(!streamReference.userMuteAudio) {
      streamReference.muteAudio();
    } else {
      streamReference.unmuteAudio();
    }
  });

document.getElementById("volume_up")
.addEventListener('click', function (event) {
  defaultVolume += 10;
  if( defaultVolume > 100) defaultVolume = 100;
  streamReference.setAudioVolume(defaultVolume);
});

document.getElementById("volume_down")
.addEventListener('click', function (event) {
  defaultVolume -= 10;
  if( defaultVolume < 0) defaultVolume = 0;
  streamReference.setAudioVolume(defaultVolume);
});

client.on("mute-audio", function (evt) {
  console.log("mute audion successful", evt);
  console.log(streamReference.getAudioLevel());
})
