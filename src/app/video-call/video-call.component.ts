import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {SignallingService} from "../services/signalling";
import {MESSAGES, ROLES} from "../constants";
import {ICECandidatePayload} from "../interfaces/ICECandidatePayload";
import {SessionDescriptionPayload} from "../interfaces/SessionDescriptionPayload";
import {ActivatedRoute} from "@angular/router";
import {environment} from "../../environments/environment";

const RTC_CONFIG = environment.RTCConfig;

@Component({
    selector: 'video-call',
    templateUrl: './video-call.component.html',
    styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit {
    @ViewChild('localVideo')
    private localVideoElement: ElementRef;

    @ViewChild('remoteVideo')
    private remoteVideoElement: ElementRef;

    private peerConnection: RTCPeerConnection;

    private receiverID: string;

    private localStreamAdded: boolean;

    constructor (
        private signallingService: SignallingService,
        private activatedRoute: ActivatedRoute
    ) {
        console.log(RTC_CONFIG);
    }

    ngOnInit () {
        this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

        this.peerConnection.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
            console.log('new ice candidate');
            if (iceEvent.candidate) {
                this.signallingService.send<ICECandidatePayload> (
                    MESSAGES.NEW_ICE_CANDIDATE, {
                        candidate: iceEvent.candidate,
                        receiverID: this.receiverID
                    });
            }
        };

        this.peerConnection.onaddstream = (event: MediaStreamEvent) => {
            console.log('new remote stream added');

            let video: HTMLVideoElement = this.remoteVideoElement.nativeElement;
            video.srcObject = event.stream;
            video.play();
        };

        this.setupVideo();

        this.activatedRoute.queryParams.subscribe((params) => {
            this.receiverID = params['companion'];

            if (params['role'] === ROLES.CALLER) { // you are the Caller
                console.log('you are the Caller');

                // setup caller signal handler
                this.handleCallerSignals();
            } else { // you have a hash fragment so you must be the Callee
                console.log('you are the Callee');

                this.handleCalleeSignals();

                // let the caller know you have arrived so they can start the call
                console.log('sending "callee_arrived" signal');
                this.signallingService.send<any>(MESSAGES.CALLEE_ARRIVED, {
                    receiverID: this.receiverID
                });
            }
        })
    }

    private newDescriptionCreated (description: RTCSessionDescription) {
        this.peerConnection.setLocalDescription(
            description,
            () => {
                this.signallingService.send<SessionDescriptionPayload>(
                    MESSAGES.NEW_DESCRIPTION, {
                        sdp: description,
                        receiverID: this.receiverID
                    });
            },
            (err) => {console.log(err)}
        );
    }

    private handleCallerSignals () : void {
        this.signallingService
            .on(MESSAGES.CALLEE_ARRIVED)
            .subscribe(this.createOffer.bind(this));

        this.signallingService
            .on(MESSAGES.NEW_ICE_CANDIDATE)
            .subscribe((payload: ICECandidatePayload) => {
                this.peerConnection.addIceCandidate (
                    new RTCIceCandidate(payload.candidate)
                );
            });

        this.signallingService
            .on(MESSAGES.NEW_DESCRIPTION)
            .subscribe((payload: SessionDescriptionPayload) => {
                this.peerConnection.setRemoteDescription (
                    new RTCSessionDescription(payload.sdp)
                );
            });
    }

    private createOffer () {
        if (this.localStreamAdded) {
            console.log("creating offer");
            this.peerConnection.createOffer(
                this.newDescriptionCreated.bind(this),
                (err) => {console.log(this)}
            );
        } else {
            console.log("local stream has not been added yet - delaying creating offer");
            setTimeout(() => {
                this.createOffer();
            }, 1000);
        }
    }

    private handleCalleeSignals () {
        // todo: move to the higher level, this is duplicated
        this.signallingService
            .on(MESSAGES.NEW_ICE_CANDIDATE)
            .subscribe((payload: ICECandidatePayload) => {
                this.peerConnection.addIceCandidate (
                    new RTCIceCandidate(payload.candidate)
                );
            });

        this.signallingService
            .on(MESSAGES.NEW_DESCRIPTION)
            .subscribe((payload: SessionDescriptionPayload) => {
                this.peerConnection.setRemoteDescription (
                    new RTCSessionDescription(payload.sdp),
                    () => { this.createAnswer(); }
                );
            });
    }

    private createAnswer () {
        if (this.localStreamAdded) {
            console.log("creating answer");
            this.peerConnection.createAnswer (
                this.newDescriptionCreated.bind(this),
                (err) => {console.log(err)}
            );
        } else {
            console.log("local stream has not been added yet - delaying creating answer");
            setTimeout(() => {
                this.createAnswer();
            }, 1000);
        }
    }

// setup stream from the local camera
    private setupVideo() {
        console.log("setting up local video stream");
        navigator.getUserMedia(
            {
                "audio": true, // request access to local microphone
                "video": true  // request access to local camera
            },
            (localStream: MediaStream) => { // success callback
                // display preview from the local camera & microphone using local <video> MediaElement
                console.log("new local stream added");

                let video: HTMLVideoElement = this.localVideoElement.nativeElement;
                video.srcObject = localStream;
                video.play();
                video.muted = true;
                // mute local video to prevent feedback

                // add local camera stream to peerConnection ready to be sent to the remote peer
                console.log("local stream added to peerConnection to send to remote peer");
                this.peerConnection.addStream(localStream);
                this.localStreamAdded = true;
            },
            (err) => {console.log(err)}
        );
    }

}
