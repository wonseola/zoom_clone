import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));


const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);
///http server


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// function handleConnection(socket) {
//     console.log(socket);
// }
// wss.on("connection", handleConnection);

const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Stranger"
    console.log("Connected to Browser ✅");
    socket.on("close", () => console.log("Disconnected from the Browser ❌"));
    socket.on("message", (message) => {
        const messageString = message.toString('utf-8');
        const messageObject = JSON.parse(messageString);
        // if (messageObject.type === "new_message") {
        //     sockets.forEach(aSocket => aSocket.send(messageObject.payload));
        // } else if (messageObject.type === "nickname") {
        //     console.log(messageObject.payload);
        // }
        switch (messageObject.type) {
            case "new_message":
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname} : ${messageObject.payload}`));
                break;
            case "nickname":
                // console.log(messageObject.payload);
                socket["nickname"] = messageObject.payload;
                break;
        }
        // socket.send(messageString);
        // console.log(message.toString('utf-8'));
    });
    // socket.send("hello!!!");
});


server.listen(3000, handleListen);

//websocket

