const http = require('http');
const debug = require('debug');
const app = require('./src/app');
const socketIo = require('socket.io');
const Filter = require('bad-words');

const { generateMessage, generateLocationMessage } = require('./src/utils/messages');
const { addUser, getUsersInRoom, getUser, removeUser } = require('./src/utils/users');

const normalizePort = val => {
    let port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        //  port num
        return port;
    }
    return false;
}

const onError = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof addr === 'string' ? 'pipe' + addr : 'port' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const onListening = () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + port;
    debug('Listening on ' + bind);
};

const port = normalizePort(process.env.PORT || 3000);
app.set('port', port);

const server = http.createServer(app);
const io = socketIo(server);

// io.on is used only for connection event
// Socket is an object that contains info about that socket (will run one time for each new connection)
io.on('connection', socket => {
    console.log('New WebSocket connection.');

    // with rooms we have two new emit methods io.to.emit - emit to everyone in a specific room,
    // socket.broadcast.to.emit - send event to everyone except a specific client in a room
    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome to the Chat app!'));
        // emit to all except this socket with broadcast
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined the chat!`));
        io.to(user.room).emit('roomUsersUpdate', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback(); // acknowledgement that the user joined the room
    });

    socket.on('sendMessage', (message, callback) => {
        const { user, error } = getUser(socket.id);
        const filter = new Filter();

        if (error) {
            return callback(error);
        }

        if (filter.isProfane(message)) {
            return callback('Error: Profanity isn\'t allowed!');
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback('Info: Message sent successfully!'); // acknowledgement of the completion of the sendMessage event.
    });

    socket.on('sendLocation', (location, callback) => {
        const { user, error } = getUser(socket.id);
        if (error) {
            return callback(error);
        }
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.lat},${location.long}`));
        callback('Info: Location shared successfully!');
    });

    // socket io handles the connection and disconnect events.
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left the chat!`));
            io.to(user.room).emit('roomUsersUpdate', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});

server.on('error', onError);
server.on('listening', onListening);

server.listen(port, () => console.log(`Server is up on port ${port}`));
