import { apiClient } from './api.client';

export type VideoIceCandidateCallback = (candidate: RTCIceCandidateInit) => void;
export type VideoConnectionStateCallback = (state: RTCPeerConnectionState) => void;
export type VideoRemoteStreamCallback = (stream: MediaStream) => void;
export type VideoAutoplayBlockedCallback = (isBlocked: boolean) => void;
export type VideoErrorCallback = (error: Error) => void;

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export class VideoWebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private statsInterval: any = null;
  private currentFacingMode: 'user' | 'environment' = 'user';

  private onIceCandidateCallback: VideoIceCandidateCallback | null = null;
  private onConnectionStateCallback: VideoConnectionStateCallback | null = null;
  private onRemoteStreamCallback: VideoRemoteStreamCallback | null = null;
  private onAutoplayBlockedCallback: VideoAutoplayBlockedCallback | null = null;
  private onErrorCallback: VideoErrorCallback | null = null;

  public notifyAutoplayBlocked(isBlocked: boolean): void {
    if (this.onAutoplayBlockedCallback) {
      this.onAutoplayBlockedCallback(isBlocked);
    }
  }

  public async fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await apiClient.get('/api/v1/video/ice-servers/');
      const data = response.data;
      if (data && Array.isArray(data.ice_servers) && data.ice_servers.length > 0) {
        console.log('[VIDEO_WEBRTC] Fetched ICE servers from backend:', data.ice_servers);
        return data.ice_servers;
      }
    } catch (err) {
      console.warn('[VIDEO_WEBRTC] Could not fetch ICE servers from backend, using defaults:', err);
    }
    return DEFAULT_ICE_SERVERS;
  }

  public async getLocalMediaStream(facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    if (
      this.localStream &&
      this.localStream.active &&
      this.localStream.getVideoTracks().some((t) => t.readyState === 'live') &&
      this.localStream.getAudioTracks().some((t) => t.readyState === 'live') &&
      this.currentFacingMode === facingMode
    ) {
      return this.localStream;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC media is not supported in this browser.');
    }

    console.log('[VIDEO_MEDIA] Requesting camera and microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: facingMode },
        },
      });

      this.currentFacingMode = facingMode;
      this.localStream = stream;

      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      console.log('[VIDEO_MEDIA] Local stream acquired:', {
        audioTracks: audioTracks.map((t) => ({ id: t.id, kind: t.kind, readyState: t.readyState, enabled: t.enabled })),
        videoTracks: videoTracks.map((t) => ({ id: t.id, kind: t.kind, readyState: t.readyState, enabled: t.enabled })),
      });

      if (audioTracks.length === 0 && videoTracks.length === 0) {
        throw new Error('No audio or video tracks available from media devices.');
      }

      return stream;
    } catch (err: any) {
      console.error('[VIDEO_MEDIA] Failed to access media devices:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera or microphone permission denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('Camera or microphone device not found on this system.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Camera or microphone is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        throw new Error('Requested camera resolution or constraints are not supported.');
      }
      throw new Error('Could not access media devices: ' + (err.message || 'Unknown error'));
    }
  }

  public async initializePeerConnection(
    onIceCandidate: VideoIceCandidateCallback,
    onConnectionStateChange: VideoConnectionStateCallback,
    onRemoteStream: VideoRemoteStreamCallback,
    onAutoplayBlocked: VideoAutoplayBlockedCallback,
    onError: VideoErrorCallback
  ): Promise<RTCPeerConnection> {
    console.log('[VIDEO_WEBRTC] Initializing RTCPeerConnection for Video Calling...');
    this.closePeerConnectionOnly();

    this.onIceCandidateCallback = onIceCandidate;
    this.onConnectionStateCallback = onConnectionStateChange;
    this.onRemoteStreamCallback = onRemoteStream;
    this.onAutoplayBlockedCallback = onAutoplayBlocked;
    this.onErrorCallback = onError;

    this.remoteStream = new MediaStream();

    const iceServers = await this.fetchIceServers();
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 4,
    });
    this.peerConnection = pc;

    // Add local tracks (Audio + Video)
    const localStream = await this.getLocalMediaStream();
    localStream.getTracks().forEach((track) => {
      track.enabled = true;
      console.log(`[VIDEO_WEBRTC] Adding local ${track.kind} track to PeerConnection:`, track.id);
      pc.addTrack(track, localStream);
    });

    // Handle remote media tracks
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log('[VIDEO_WEBRTC] Remote track received:', {
        kind: event.track.kind,
        readyState: event.track.readyState,
        streamsCount: event.streams.length,
      });

      if (this.remoteStream) {
        if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      } else {
        this.remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      }

      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }

      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback('connected');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log('[VIDEO_ICE] Local candidate generated:', event.candidate.candidate);
        if (this.onIceCandidateCallback) {
          this.onIceCandidateCallback(event.candidate.toJSON());
        }
      } else {
        console.log('[VIDEO_ICE] Local candidate gathering complete');
      }
    };

    pc.onicecandidateerror = (event: any) => {
      console.warn('[VIDEO_ICE] Candidate error:', event.errorCode, event.errorText, event.url);
    };

    // Handle Signaling and ICE gathering state changes
    pc.onsignalingstatechange = () => {
      if (!this.peerConnection) return;
      console.log('[VIDEO_WEBRTC] Signaling state:', this.peerConnection.signalingState);
    };

    pc.onicegatheringstatechange = () => {
      if (!this.peerConnection) return;
      console.log('[VIDEO_ICE] Gathering state:', this.peerConnection.iceGatheringState);
    };

    // Handle Connection state changes
    pc.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      console.log('[VIDEO_WEBRTC] Connection state:', state);
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(state);
      }

      if (state === 'connected') {
        console.log('[VIDEO_WEBRTC] Peer-to-peer Video + Audio connection ESTABLISHED');
        this.startStatsLogging();
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        this.stopStatsLogging();
        if (state === 'failed' && this.onErrorCallback) {
          this.onErrorCallback(new Error('Video call connection failed. Please check network/firewall.'));
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const iceState = this.peerConnection.iceConnectionState;
      console.log('[VIDEO_ICE] Connection state:', iceState);
      if (iceState === 'connected' || iceState === 'completed') {
        if (this.onConnectionStateCallback) {
          this.onConnectionStateCallback('connected');
        }
        this.startStatsLogging();
      } else if (iceState === 'failed') {
        if (this.onConnectionStateCallback) {
          this.onConnectionStateCallback('failed');
        }
        this.stopStatsLogging();
      }
    };

    return pc;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    console.log('[VIDEO_SIGNALING] Creating SDP Offer with Audio + Video...');
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    console.log('[VIDEO_SIGNALING] Setting local description (Offer)...');
    await this.peerConnection.setLocalDescription(offer);
    console.log('[VIDEO_SIGNALING] Local description set:', this.peerConnection.localDescription?.type);
    return offer;
  }

  public async handleOfferAndCreateAnswer(
    offer: RTCSessionDescriptionInit | string
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    const sessionDesc =
      typeof offer === 'string'
        ? new RTCSessionDescription({ type: 'offer', sdp: offer })
        : new RTCSessionDescription(offer);

    console.log('[VIDEO_SIGNALING] Setting remote description (Offer)...');
    await this.peerConnection.setRemoteDescription(sessionDesc);
    console.log('[VIDEO_SIGNALING] Remote description set successfully:', this.peerConnection.remoteDescription?.type);

    await this.drainPendingIceCandidates();

    console.log('[VIDEO_SIGNALING] Creating SDP Answer with Audio + Video...');
    const answer = await this.peerConnection.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    console.log('[VIDEO_SIGNALING] Setting local description (Answer)...');
    await this.peerConnection.setLocalDescription(answer);
    console.log('[VIDEO_SIGNALING] Local description set:', this.peerConnection.localDescription?.type);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit | string): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    const sessionDesc =
      typeof answer === 'string'
        ? new RTCSessionDescription({ type: 'answer', sdp: answer })
        : new RTCSessionDescription(answer);

    console.log('[VIDEO_SIGNALING] Setting remote description (Answer)...');
    await this.peerConnection.setRemoteDescription(sessionDesc);
    console.log('[VIDEO_SIGNALING] Remote description set successfully:', this.peerConnection.remoteDescription?.type);

    await this.drainPendingIceCandidates();
  }

  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!candidateInit || !candidateInit.candidate) return;

    if (
      this.peerConnection &&
      this.peerConnection.remoteDescription &&
      this.peerConnection.remoteDescription.type
    ) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
        console.log('[VIDEO_ICE] Remote candidate added successfully');
      } catch (err) {
        console.error('[VIDEO_ICE] Error adding remote candidate:', err);
      }
    } else {
      console.log('[VIDEO_ICE] Queuing remote candidate (waiting for remote description)');
      this.pendingCandidates.push(candidateInit);
    }
  }

  private async drainPendingIceCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;

    console.log(`[VIDEO_ICE] Draining ${this.pendingCandidates.length} queued remote candidates...`);
    while (this.pendingCandidates.length > 0) {
      const candidateInit = this.pendingCandidates.shift();
      if (candidateInit) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
          console.log('[VIDEO_ICE] Queued candidate applied');
        } catch (err) {
          console.error('[VIDEO_ICE] Error applying queued candidate:', err);
        }
      }
    }
  }

  public setMute(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      console.log('[VIDEO_MEDIA] Microphone muted set to:', isMuted);
    }
  }

  public setCameraOff(isCameraOff: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
      console.log('[VIDEO_MEDIA] Camera disabled set to:', isCameraOff);
    }
  }

  public async switchCamera(): Promise<MediaStream | null> {
    if (!this.localStream || !this.peerConnection) return null;
    const targetFacing = this.currentFacingMode === 'user' ? 'environment' : 'user';
    console.log('[VIDEO_MEDIA] Switching camera to:', targetFacing);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: targetFacing } },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        // Replace track on RTCPeerConnection sender
        const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        // Stop old video track
        this.localStream.getVideoTracks().forEach((t) => t.stop());
        this.localStream.removeTrack(this.localStream.getVideoTracks()[0]);
        this.localStream.addTrack(newVideoTrack);
        this.currentFacingMode = targetFacing;
        return this.localStream;
      }
    } catch (e) {
      console.warn('[VIDEO_MEDIA] Could not switch camera (possibly single camera device):', e);
    }
    return null;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  private startStatsLogging(): void {
    this.stopStatsLogging();
    this.statsInterval = setInterval(async () => {
      if (!this.peerConnection) return;
      try {
        const stats = await this.peerConnection.getStats();
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp') {
            console.log(`[VIDEO_STATS] Inbound RTP ${report.kind?.toUpperCase()}:`, {
              packetsReceived: report.packetsReceived,
              packetsLost: report.packetsLost,
              bytesReceived: report.bytesReceived,
              jitter: report.jitter,
              framesDecoded: (report as any).framesDecoded,
            });
          }
          if (report.type === 'outbound-rtp') {
            console.log(`[VIDEO_STATS] Outbound RTP ${report.kind?.toUpperCase()}:`, {
              packetsSent: report.packetsSent,
              bytesSent: report.bytesSent,
              framesEncoded: (report as any).framesEncoded,
            });
          }
          if (report.type === 'candidate-pair' && (report as any).state === 'succeeded') {
            console.log('[VIDEO_STATS] Active Candidate Pair:', {
              state: (report as any).state,
              currentRoundTripTime: (report as any).currentRoundTripTime,
              bytesSent: report.bytesSent,
              bytesReceived: report.bytesReceived,
            });
          }
        });
      } catch (e) {}
    }, 3000);
  }

  private stopStatsLogging(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private closePeerConnectionOnly(): void {
    this.stopStatsLogging();
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }
  }

  public cleanup(): void {
    console.log('[VIDEO_WEBRTC] Cleaning up Video WebRTC session & stopping hardware tracks...');
    this.stopStatsLogging();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
          console.log(`[VIDEO_MEDIA] Stopped local track: ${track.kind} (${track.id})`);
        } catch (e) {}
      });
      this.localStream = null;
    }

    this.closePeerConnectionOnly();

    this.remoteStream = null;
    this.pendingCandidates = [];
    this.onIceCandidateCallback = null;
    this.onConnectionStateCallback = null;
    this.onRemoteStreamCallback = null;
    this.onAutoplayBlockedCallback = null;
    this.onErrorCallback = null;
  }
}

export const videoWebRTCService = new VideoWebRTCService();
