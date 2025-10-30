const socket = io();

// ดึง Element จาก HTML
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
//  "ถังพัก" สำหรับเก็บ Candidate ที่อาจจะมาก่อนเวลา
let iceCandidateQueue = [];

const stunServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// --- จัดการ Event Listener ---
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);
acceptButton.addEventListener('click', acceptCall);
declineButton.addEventListener('click', declineCall);

// --- ฟังก์ชันหลัก ---

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
    iceCandidateQueue = []; // เคลียร์ถังพักเมื่อวางสาย
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

        //  เมื่อตั้งค่าทุกอย่างพร้อมแล้ว ค่อยประมวลผล Candidate ที่ค้างอยู่
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

//  ฟังก์ชันใหม่สำหรับประมวลผล Candidate ในถังพัก
async function processIceQueue() {
    while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift(); // ดึงอันแรกออก
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error("Error processing queued ICE candidate", error);
        }
    }
}

// --- การทำงานเมื่อได้รับสัญญาณจาก Server ---

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
            //  เมื่อผู้โทรได้รับ Answer และพร้อมแล้ว ก็ให้ประมวลผล Candidate ที่ค้างอยู่เช่นกัน
            await processIceQueue();
        } catch (error) {
            console.error("CALLER: Failed to set remote description:", error);
        }
    }
});

socket.on('candidate', (candidate) => {
    const iceCandidate = new RTCIceCandidate(candidate);
    //  ถ้า peerConnection พร้อมและรู้ว่าจะคุยกับใคร (มี remoteDescription) ก็ให้เพิ่ม Candidate ทันที
    //  ถ้าไม่พร้อม ให้เก็บลง "ถังพัก" ไปก่อน
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