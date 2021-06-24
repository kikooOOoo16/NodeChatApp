const socket = io();

// Elements $ = indicator that we have an element from the DOM
const $messageForm = document.querySelector('#send-message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoscroll = () => {
//    New message element
    const $newMessage = $messages.lastElementChild;
//    Height of the new message
    const newMessageStyles = getComputedStyle($newMessage); // needed for margin spacing on the bottom
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

//    Visible height
    const visibleHeight = $messages.offsetHeight;
//    Height of messages container
    const containerHeight = $messages.scrollHeight;
//    How far user has scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    // check if at bottom before last message was added
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight; // push to bottom
    }

}

socket.on('message', messageData => {
    const html = Mustache.render(messageTemplate, {
        username: messageData.username,
        message: messageData.text,
        createdAt: moment(messageData.createdAt).format('H:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', mapsUrlData => {
    const html = Mustache.render(locationTemplate, {
        username: mapsUrlData.username,
        mapUrl: mapsUrlData.mapUrl,
        createdAt: moment(mapsUrlData.createdAt).format('H:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// Update room users list
socket.on('roomUsersUpdate', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', e => {
    e.preventDefault();

    const message = e.target.elements.message.value;
    if (!message && message === '') {
        return alert('Message input can\'t be empty!');
    }

    $messageFormButton.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', message, resMessage => {
        if (resMessage.split(':')[0] === 'Error') {
            if (resMessage.split(':')[1] === ' Profanity isn\'t allowed!') {
                alert(resMessage);
                location["href"] = location.href;
                return;
            } else {
                alert(resMessage);
                location.href = '/';
                return;
            }
        }
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
    });
});

$sendLocationButton.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geolocation isn\'t supported by your browser.');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition(({coords: {longitude, latitude}}) => {
        const location = {
            lat: latitude,
            long: longitude
        }

        socket.emit('sendLocation', location, resMessage => {
            if (resMessage.split(':')[0] === 'Error') {
                return alert(resMessage);
            }
            $sendLocationButton.removeAttribute('disabled');
        });
    });
});

socket.emit('join', {username, room}, error => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
