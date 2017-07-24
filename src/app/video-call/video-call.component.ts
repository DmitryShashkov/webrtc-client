import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SessionDescriptionPayload } from '../interfaces/SessionDescriptionPayload';
import { ICECandidatePayload } from '../interfaces/ICECandidatePayload';
import { SubscriptionsList } from '../interfaces/SubscriptionsList';
import { environment } from '../../environments/environment';
import { HangUpPayload } from '../interfaces/HangUpPayload';
import { SignallingService } from '../services/signalling';
import { ActivatedRoute, Router } from '@angular/router';
import { MESSAGES, ROLES } from '../constants';
import Logger from '../helpers/logger';

@Component({
    selector: 'video-call',
    templateUrl: './video-call.component.html',
    styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit, OnDestroy {
    @ViewChild('localVideo')
    private localVideoElement: ElementRef;

    @ViewChild('remoteVideo')
    private remoteVideoElement: ElementRef;

    private peerConnection: RTCPeerConnection;

    private receiverID: string;

    private localStreamAdded: boolean;

    private subscriptions: SubscriptionsList = {};

    constructor (
        private signallingService: SignallingService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit () {
        this.peerConnection = new RTCPeerConnection(environment.RTCConfig);

        this.peerConnection.onicecandidate = this.onICECandidateReceived.bind(this);

        this.peerConnection.onaddstream = this.onRemoteStreamAdded.bind(this);

        this.setupLocalVideo();

        this.activatedRoute.queryParams.subscribe(this.manageSubscriptions.bind(this));
    }

    private onICECandidateReceived (iceEvent: RTCPeerConnectionIceEvent) {
        Logger.log('New ice candidate');
        if (iceEvent.candidate) {
            this.signallingService.send<ICECandidatePayload> (
                MESSAGES.NEW_ICE_CANDIDATE, {
                candidate: iceEvent.candidate,
                receiverID: this.receiverID
            });
        }
    }

    private onRemoteStreamAdded  (event: MediaStreamEvent) {
        Logger.log('New remote stream added');

        let video: HTMLVideoElement = this.remoteVideoElement.nativeElement;
        video.srcObject = event.stream;
        video.play();
    }

    private manageSubscriptions (params) {
        this.receiverID = params['companion'];

        if (params['role'] === ROLES.CALLER) {
            Logger.log('You are the caller');
            this.subscriptions[ MESSAGES.CALLEE_ARRIVED ] =
                this.signallingService
                    .on(MESSAGES.CALLEE_ARRIVED)
                    .subscribe(this.createOffer.bind(this))
        } else {
            Logger.log('You are the Callee');
            this.signallingService.send<any>(MESSAGES.CALLEE_ARRIVED, {
                receiverID: this.receiverID
            });
        }

        this.subscriptions[ MESSAGES.NEW_ICE_CANDIDATE ] =
            this.signallingService
                .on(MESSAGES.NEW_ICE_CANDIDATE)
                .subscribe((payload: ICECandidatePayload) => {
                    this.peerConnection.addIceCandidate (
                        new RTCIceCandidate(payload.candidate)
                    ).catch(VideoCallComponent.handleError);
                });

        this.subscriptions[ MESSAGES.NEW_DESCRIPTION ] =
            this.signallingService
                .on(MESSAGES.NEW_DESCRIPTION)
                .subscribe((payload: SessionDescriptionPayload) => {
                    this.peerConnection
                        .setRemoteDescription( new RTCSessionDescription(payload.sdp) )
                        .then(() => {
                            if (params['role'] === ROLES.CALLEE) {
                                this.createAnswer();
                            }
                        })
                        .catch(VideoCallComponent.handleError)
                });

        this.subscriptions[ MESSAGES.CALL.ENDED ] =
            this.signallingService
                .on(MESSAGES.CALL.ENDED)
                .subscribe(this.hangUp.bind(this));
    }


    private newDescriptionCreated (description: RTCSessionDescription) {
        this.peerConnection
            .setLocalDescription(description)
            .then(() => {
                this.signallingService.send<SessionDescriptionPayload>(
                    MESSAGES.NEW_DESCRIPTION, {
                        sdp: description,
                        receiverID: this.receiverID
                    });
            })
            .catch(VideoCallComponent.handleError);
    }

    private createOffer () {
        if (this.localStreamAdded) {
            Logger.log('Creating offer');
            this.peerConnection.createOffer()
                .then(this.newDescriptionCreated.bind(this))
                .catch(VideoCallComponent.handleError);
        } else {
            setTimeout(this.createOffer.bind(this), 1000);
        }
    }

    private createAnswer () {
        if (this.localStreamAdded) {
            Logger.log('Creating answer');
            this.peerConnection.createAnswer()
                .then(this.newDescriptionCreated.bind(this))
                .catch(VideoCallComponent.handleError);
        } else {
            setTimeout(this.createAnswer.bind(this), 1000);
        }
    }

    private setupLocalVideo () {
        navigator.getUserMedia (
            { 'audio': true, 'video': true },
            (localStream: MediaStream) => {
                Logger.log('New local stream added');

                let video: HTMLVideoElement = this.localVideoElement.nativeElement;
                video.srcObject = localStream;
                video.play();
                video.muted = true;

                this.peerConnection.addStream(localStream);
                this.localStreamAdded = true;
            },
            VideoCallComponent.handleError
        );
    }

    private hangUp () {
        // noinspection JSIgnoredPromiseFromCall
        this.router.navigate(['/']);
    }

    private static handleError (err: any) {
        Logger.log(err);
    }

    ngOnDestroy () {
        this.signallingService.send<HangUpPayload> (
            MESSAGES.CALL.ENDED, {
                senderID: this.signallingService.currentUser.id,
                receiverID: this.receiverID
            });

        for (let key in this.subscriptions) {
            this.subscriptions[key].unsubscribe();
        }
    }

}
