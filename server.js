require("dotenv").config();
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});
const session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true,
});
const sharedsession = require("express-socket.io-session");

app.use(session);
io.use(sharedsession(session));

var firebase = require("firebase");
var firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};
firebase.initializeApp(firebaseConfig);

let database = firebase.database();

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";

//Whenever someone connects this gets executed
io.on("connection", (socket) => {
  // Join a conversation
  const { rid, userID, username } = socket.handshake.query;
  socket.join(rid);
  socket.handshake.session.save();
  // console.log(socket.id);
  // console.log("userID: ", userID);
  database.ref(`${rid}/users/${userID}`).update({
    username: username,
  });

  // Listen for new messages
  socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
    // console.log(data);
    database.ref(`${rid}/messages`).push().set({
      senderID: data.senderUserID,
      message: data.body,
    });
    io.in(rid).emit(NEW_CHAT_MESSAGE_EVENT, data);
  });

  // Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    socket.leave(rid);
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}

http.listen(port, function () {
  console.log("listening on *:4000");
});
