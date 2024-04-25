import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui"


const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(wsServer, {
    auth: false,
    mode: "development",
});

function publicRooms() {
    const { sockets: { adapter: { sids, rooms }, }, } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    })
    return publicRooms;

}

function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    wsServer.sockets.emit("room_change", publicRooms());
    socket["nickname"] = "Strnager";
    socket.onAny((event) => {
        // console.log(wsServer.sockets.adapter);
        // console.log(`socket event: ${event}`);
    })
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        // console.log(socket.rooms); //socket id
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) =>
            socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());

    })
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname} : ${msg}`);
        done();
    });
    socket.on("nickname", (nickname) => socket["nickname"] = nickname);
});
const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
// app.listen(3000, handleListen);
///http server

/*

import WebSocket from "ws";

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


*///websocket
