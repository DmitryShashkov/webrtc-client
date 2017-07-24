export const environment = {
    production: false,
    RTCConfig: {
        'iceServers': [
            { 'url': 'stun:stun.l.google.com:19302' }
        ]
    },
    signalEndpoint: 'localhost:7055',
    verbose: true
};
