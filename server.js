const bodyParser = require("body-parser");
const { Socket } = require("dgram");
const ejs = require("ejs");

const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("mainChat", { userName: users_name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const name = req.body.nameInp;
  // console.log(name);
  res.redirect("/mainChat");
});

const users = {};
const users_name = [];
let socketId = [];
let socketPair = {};
let peerId = {};

io.on("connection", (socket) => {
  console.log("Socket Array :" + socketId + "  Size :" + socketId.length);
  socket.on("idpasser", (id) => {
    // socket.broadcast.emit('user-connected',id);
    peerId[socket.id] = id;
    console.log(id);
  });
  function pairing() {
    if (socketId.length > 1) {
      socketId.splice(socketId.indexOf(socket.id), 1);
      console.log(
        "Socket Array after delete of socket.id :" +
          socketId +
          "  Size :" +
          socketId.length
      );
      let tempUser = socketId[Math.floor(Math.random() * socketId.length)];
      socketId.splice(socketId.indexOf(tempUser), 1);
      socketPair[socket.id] = tempUser;
      socketPair[tempUser] = socket.id;

      socket.to(tempUser).emit("user-connected", peerId[socket.id]);
      const stat = "you are now connected to a stranger";
      socket.to(socketPair[socket.id]).emit("status", stat);
      socket.emit("status", stat);
    }
  }
  socket.on("joinChat", (data) => {
    if (socketId.indexOf(socket.id) == -1) {
      console.log("Socket id getting from leave and join :" + data.socketId);
      socketId.push(socket.id);
    }
    pairing();
  });

  function left() {
    const stat = "Disconnected";
    socket.emit("status", stat);
    socket.to(socketPair[socket.id]).emit("status", stat);
    let tempData = socketPair[socket.id];
    delete socketPair[socket.id];
    delete socketPair[tempData];
  }

  socket.on("leave", (data) => {
    socket.to(socketPair[socket.id]).emit("disconnection", "Stranger");
    socket.to(socketPair[socket.id]).emit("user-disconnected", peerId[socket.id]);
    left();
  });

  socket.on("send", (message) => {
    socket.to(socketPair[socket.id]).emit("receive", { message: message, name: "Stranger" });
  });
  socket.on("disconnect", (message) => {
    socket.to(socketPair[socket.id]).emit("disconnection", "Stranger");
    socket.to(socketPair[socket.id]).emit("user-disconnected", peerId[socket.id]);
    left();
  });
});

http.listen(3000, () => {
  console.log("Server started at port 3000.");
});
