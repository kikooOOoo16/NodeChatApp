const users = [];

const addUser = ({id, username, room}) => {
//   Clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

//    Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

//    Check for existing user
    const existingUser = users.find(user => {
        return user.room === room && user.username === username
    });

//    Validate username
    if (existingUser) {
        return {
            error: 'Username is already in use!'
        }
    }

//    Store user
    const user = { id, username, room };
    users.push(user);

    return {
        user
    }
}

const removeUser = id => {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

const getUser = id => {
    const user = users.find(user => user.id === id);
    if (!user) {
        return {
            error: `Error: No user found with the id ${id}!`
        }
    }
    return {
        user
    }
}

const getUsersInRoom = room => {
    room = room.trim().toLowerCase();
    const usersInRoom = users.filter(user => user.room === room);

    if (usersInRoom.length === 0) {
        return {
            info: `The room ${room} has no active users!`
        }
    }
    return usersInRoom;
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
