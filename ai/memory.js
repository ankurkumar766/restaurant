const chats = new Map();

function getHistory(userId) {

    if (!chats.has(userId)) {
        chats.set(userId, []);
    }

    return chats.get(userId);
}

function saveMessage(userId, role, message) {

    const history = getHistory(userId);

    history.push({
        role,
        message
    });

    if (history.length > 20) {
        history.shift();
    }
}

module.exports = {
    getHistory,
    saveMessage
};