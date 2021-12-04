const socket = io();
const form = document.getElementById("send-container");
const messageInput = document.getElementById("messageInp");
const messageContainer = document.querySelector(".container");
const message = document.querySelectorAll(".message");
const status = document.querySelector(".wait");
let socketId;

const myPeer = new Peer();
const peers = {};

const joinLeaveBtn = document.querySelector(".join-leave-btn");
const videoGrid = document.querySelector(".vc");
const myVideo = document.createElement("video");
myVideo.muted = true;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.classList.add("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });
    socket.on("user-connected", (userId) => {
      console.log("User Connected : " + userId);
      connectToNewUser(userId, stream);
    });
  });

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  let video = document.createElement("video");
  video.classList.add("video");

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
  }
  const video = document.querySelector(".video");
  video.remove();
  if (joinLeaveBtn.innerText == "Join") {
    joinLeaveBtn.innerText = "Leave";
  } else if (joinLeaveBtn.innerText == "Leave") {
    joinLeaveBtn.innerText = "Join";
  }
});

function append(message, position) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageElement.classList.add("message");
  messageElement.classList.add(position);
  messageContainer.append(messageElement);
}

function erase(x) {
  status.innerText = x;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  append(`You: ${message}`, "right");
  socket.emit("send", message);
  messageInput.value = "";
});

myPeer.on("open", (id) => {
  socket.emit("idpasser", id);
});

joinLeaveBtn.addEventListener("click", (e) => {
  if (joinLeaveBtn.innerText == "Join") {
    joinLeaveBtn.innerText = "Leave";
    socket.emit("joinChat", { socketId: socketId });
  } else if (joinLeaveBtn.innerText == "Leave") {
    joinLeaveBtn.innerText = "Join";
    // if (peers[userId]){
    //   peers[userId].close();
    //  }
    const video = document.querySelector(".video");
    video.remove();

    const deletingMessages = document.querySelectorAll(".message");
    deletingMessages.forEach(e => e.remove())


    // append(`Stranger left the chat`, 'middle');
    socket.emit("leave", { socketId: socketId });
  }
});

socket.on("disconnection", (name) => {
  messageContainer.innerHTML = "";
  append(`Stranger left the chat`, "middle");
});

socket.emit("new-user-joined", "Birju");

socket.on("user-joined", (name1) => {
  append(`${name1} joined the chat`, "right");
});

socket.on("receive", (message) => {
  append(`${message.name}: ${message.message}`, "left");
});

socket.on("leave", (name) => {
  append(`Stranger left the chat`, "middle");
});

socket.on("status", (stat) => {
  status.innerText = stat;
});

socket.on("messageDelete", message => {
  message.innerText = message;
})
