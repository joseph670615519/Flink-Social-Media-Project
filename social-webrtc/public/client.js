const socket = io();

// Get elements from HTML
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const incomingCallDiv = document.getElementById('incomingCall');
const acceptButton = document.getElementById('acceptButton');
const declineButton = document.getElementById('declineButton');

let localStream;
let peerConnection;
let receivedOffer;
// "Holding bucket" to store ICE candidates that may arrive early
let iceCandidateQueue = [];

const stunServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// --- Event listeners ---
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);
acceptButton.addEventListener('click', acceptCall);
declineButton.addEventListener('click', declineCall);

// --- Main functions ---

async function start() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        startButton.disabled = true;
        callButton.disabled = false;
    } catch (error) {
        console.error("Error accessing media devices.", error);
        alert("Could not access camera and microphone.");
    }
}

async function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    
    createPeerConnection();

    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);
    } catch (error) {
        console.error("CALLER: Error creating offer:", error);
    }
}

function hangup() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    iceCandidateQueue = []; // Clear the candidate queue when hanging up
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    startButton.disabled = false;
    callButton.disabled = true;
    hangupButton.disabled = true;
    incomingCallDiv.classList.add('hidden');
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(stunServers);
    
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };
    
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };
    
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`SYSTEM: ICE Connection State changed to: ${peerConnection.iceConnectionState}`);
    };
}

async function acceptCall() {
    createPeerConnection();
    
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(receivedOffer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

    // Once everything is set up, process any queued ICE candidates
        await processIceQueue();
        
        socket.emit('answer', answer);
    } catch (error) {
        console.error("RECEIVER: Error during call acceptance:", error);
    }

    incomingCallDiv.classList.add('hidden');
    hangupButton.disabled = false;
}

function declineCall() {
    socket.emit('decline'); 
    incomingCallDiv.classList.add('hidden');
}

// New function to process queued ICE candidates
async function processIceQueue() {
    while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift(); // Remove the first one
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error("Error processing queued ICE candidate", error);
        }
    }
}

// --- Handling signals from the server ---

socket.on('offer', (offer) => {
    if (!peerConnection) { 
        receivedOffer = offer;
        incomingCallDiv.classList.remove('hidden');
    }
});

socket.on('answer', async (answer) => {
    if (peerConnection) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            // When caller receives the answer and is ready, process any queued ICE candidates as well
            await processIceQueue();
        } catch (error) {
            console.error("CALLER: Failed to set remote description:", error);
        }
    }
});

socket.on('candidate', (candidate) => {
    const iceCandidate = new RTCIceCandidate(candidate);
    // If peerConnection is ready and has a remoteDescription, add the candidate immediately
    // Otherwise, store it in the queue to be processed later
    if (peerConnection && peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(iceCandidate)
            .catch(error => console.error("Error adding received ICE candidate", error));
    } else {
        iceCandidateQueue.push(iceCandidate);
    }
});

socket.on('decline', () => {
    alert("The user declined your call.");
    callButton.disabled = false;
    hangupButton.disabled = true;
});

socket.on('user-disconnected', () => {
    alert("User has disconnected.");
    hangup();
});