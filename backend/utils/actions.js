const actions = {
    SEND_MESSAGE: 'send_message',
    SEND_MESSAGE_ERROR: 'send_message_error',
    RECEIVE_MESSAGE: 'receive_message',

    USER_CONNECTED: 'user_connected',
    USER_OFFLINE: 'user_offline',

    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    USER_TYPING: 'user_typing',

    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',

    USER_STATUS_UPDATE: 'user_status_update',
    GET_USER_STATUS: 'get_user_status',

    MESSAGE_READ: 'message_read',
    MESSAGE_STATUS_UPDATED: 'message_status_updated',
    MESSAGE_DELETED: 'message_deleted',

    ADD_REACTION: 'add_reaction',
    REACTION_UPDATE: 'reaction_update',
}

module.exports = { actions };