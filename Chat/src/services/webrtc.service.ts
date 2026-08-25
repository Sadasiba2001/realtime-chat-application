import { apiClient } from './api.client';

export type IceCandidateCallback = (candidate: RTCIceCandidateInit) => void;
export type ConnectionStateCallback = (state: RTCPeerConnectionState) => void;
export type AutoplayBlockedCallback = (isBlocked: boolean) => void;
export type ErrorCallback = (error: Error) => void;

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private statsInterval: any = null;

  private onIceCandidateCallback: IceCandidateCallback | null = null;
  private onConnectionStateCallback: ConnectionStateCallback | null = null;
  private onAutoplayBlockedCallback: AutoplayBlockedCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;

  public async fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await apiClient.get('/api/v1/voice/ice-servers/');
      const data = response.data;
      if (data && Array.isArray(data.ice_servers) && data.ice_servers.length > 0) {
        console.log('[WEBRTC] Fetched ICE servers from backend:', data.ice_servers);
        return data.ice_servers;
      }
    } catch (err) {
      console.warn('[WEBRTC] Could not fetch ICE servers from backend, using defaults:', err);
    }
    return DEFAULT_ICE_SERVERS;
  }

  private ensureAudioElement(): HTMLAudioElement {
    if (!this.remoteAudioElement) {
      let existing = document.getElementById('webrtc-remote-audio') as HTMLAudioElement;
      if (!existing) {
        existing = document.createElement('audio');
        existing.id = 'webrtc-remote-audio';
        existing.autoplay = true;
        existing.setAttribute('playsinline', 'true');
        existing.setAttribute('autoplay', 'true');
        existing.style.display = 'none';
        document.body.appendChild(existing);
      }
      this.remoteAudioElement = existing;
    }
    this.remoteAudioElement.muted = false;
    this.remoteAudioElement.volume = 1.0;
    return this.remoteAudioElement;
  }

  public async getLocalAudioStream(): Promise<MediaStream> {
    if (
      this.localStream &&
      this.localStream.active &&
      this.localStream.getAudioTracks().some((t) => t.readyState === 'live')
    ) {
      return this.localStream;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC is not supported in this browser.');
    }

    console.log('[AUDIO] Requesting microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.localStream = stream;
      const tracks = stream.getAudioTracks();
      console.log(
        '[AUDIO] Microphone stream acquired:',
        tracks.map((t) => ({
          id: t.id,
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        }))
      );
      return stream;
    } catch (err: any) {
      console.error('[AUDIO] Failed to access microphone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No microphone device found on this system.');
      }
      throw new Error('Could not access microphone: ' + (err.message || 'Unknown error'));
    }
  }

  public async initializePeerConnection(
    onIceCandidate: IceCandidateCallback,
    onConnectionStateChange: ConnectionStateCallback,
    onAutoplayBlocked: AutoplayBlockedCallback,
    onError: ErrorCallback
  ): Promise<RTCPeerConnection> {
    console.log('[WEBRTC] Initializing RTCPeerConnection...');
    this.closePeerConnectionOnly();

    this.onIceCandidateCallback = onIceCandidate;
    this.onConnectionStateCallback = onConnectionStateChange;
    this.onAutoplayBlockedCallback = onAutoplayBlocked;
    this.onErrorCallback = onError;

    this.ensureAudioElement();

    const iceServers = await this.fetchIceServers();
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 4,
    });
    this.peerConnection = pc;

    // Add local microphone audio tracks
    const localStream = await this.getLocalAudioStream();
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = true;
      console.log('[WEBRTC] Added local audio track to PeerConnection:', track.id);
      pc.addTrack(track, localStream);
    });

    // Handle remote media tracks
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log('[WEBRTC] Remote track received:', {
        kind: event.track.kind,
        readyState: event.track.readyState,
        streamsCount: event.streams.length,
      });

      const remoteStream =
        event.streams && event.streams[0]
          ? event.streams[0]
          : new MediaStream([event.track]);

      const audioTracks = remoteStream.getAudioTracks();
      console.log(
        '[WEBRTC] Remote audio tracks:',
        audioTracks.map((t) => ({
          id: t.id,
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        }))
      );

      this.attachRemoteStream(remoteStream);
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback('connected');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log('[ICE] Local candidate generated:', event.candidate.candidate);
        if (this.onIceCandidateCallback) {
          this.onIceCandidateCallback(event.candidate.toJSON());
        }
      } else {
        console.log('[ICE] Local candidate gathering complete');
      }
    };

    pc.onicecandidateerror = (event: any) => {
      console.warn('[ICE] Candidate error:', event.errorCode, event.errorText, event.url);
    };

    // Handle WebRTC connection state
    pc.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      console.log('[WEBRTC] Connection state:', state);
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(state);
      }

      if (state === 'connected') {
        console.log('[WEBRTC] Peer-to-peer audio connection ESTABLISHED');
        this.startStatsLogging();
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        this.stopStatsLogging();
        if (state === 'failed' && this.onErrorCallback) {
          this.onErrorCallback(new Error('WebRTC connection failed. Check NAT/firewall or TURN settings.'));
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const iceState = this.peerConnection.iceConnectionState;
      console.log('[ICE] Connection state:', iceState);
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

  private async attachRemoteStream(stream: MediaStream): Promise<void> {
    const audio = this.ensureAudioElement();
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.muted = false;
    audio.volume = 1.0;

    console.log('[AUDIO] Attaching remote stream to HTMLAudioElement');
    try {
      await audio.play();
      console.log('[AUDIO] Remote audio playback started successfully');
      if (this.onAutoplayBlockedCallback) {
        this.onAutoplayBlockedCallback(false);
      }
    } catch (err: any) {
      console.warn('[AUDIO] Remote audio playback blocked by browser autoplay policy:', err);
      if (this.onAutoplayBlockedCallback) {
        this.onAutoplayBlockedCallback(true);
      }
    }
  }

  public async playRemoteAudio(): Promise<boolean> {
    if (this.remoteAudioElement) {
      try {
        await this.remoteAudioElement.play();
        console.log('[AUDIO] User triggered audio playback succeeded');
        if (this.onAutoplayBlockedCallback) {
          this.onAutoplayBlockedCallback(false);
        }
        return true;
      } catch (err) {
        console.error('[AUDIO] User triggered audio playback failed:', err);
        return false;
      }
    }
    return false;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    console.log('[SIGNALING] Creating SDP Offer...');
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });

    console.log('[SIGNALING] Setting local description (Offer)...');
    await this.peerConnection.setLocalDescription(offer);
    console.log('[SIGNALING] Local description set:', this.peerConnection.localDescription?.type);
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

    console.log('[SIGNALING] Setting remote description (Offer)...');
    await this.peerConnection.setRemoteDescription(sessionDesc);
    console.log('[SIGNALING] Remote description set successfully:', this.peerConnection.remoteDescription?.type);

    await this.drainPendingIceCandidates();

    console.log('[SIGNALING] Creating SDP Answer...');
    const answer = await this.peerConnection.createAnswer({
      offerToReceiveAudio: true,
    });

    console.log('[SIGNALING] Setting local description (Answer)...');
    await this.peerConnection.setLocalDescription(answer);
    console.log('[SIGNALING] Local description set:', this.peerConnection.localDescription?.type);
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

    console.log('[SIGNALING] Setting remote description (Answer)...');
    await this.peerConnection.setRemoteDescription(sessionDesc);
    console.log('[SIGNALING] Remote description set successfully:', this.peerConnection.remoteDescription?.type);

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
        console.log('[ICE] Remote candidate added');
      } catch (err) {
        console.error('[ICE] Error adding candidate:', err);
      }
    } else {
      console.log('[ICE] Queuing remote candidate (remote description not set yet)');
      this.pendingCandidates.push(candidateInit);
    }
  }

  private async drainPendingIceCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;

    console.log(`[ICE] Draining ${this.pendingCandidates.length} queued remote candidates...`);
    while (this.pendingCandidates.length > 0) {
      const candidateInit = this.pendingCandidates.shift();
      if (candidateInit) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
          console.log('[ICE] Queued remote candidate applied');
        } catch (err) {
          console.error('[ICE] Error applying queued candidate:', err);
        }
      }
    }
  }

  public setMute(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      console.log('[AUDIO] Microphone muted state set to:', isMuted);
    }
  }

  private startStatsLogging(): void {
    this.stopStatsLogging();
    this.statsInterval = setInterval(async () => {
      if (!this.peerConnection || this.peerConnection.connectionState !== 'connected') {
        return;
      }
      try {
        const stats = await this.peerConnection.getStats();
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            console.log('[AUDIO] Incoming RTP audio stats:', {
              packetsReceived: report.packetsReceived,
              packetsLost: report.packetsLost,
              bytesReceived: report.bytesReceived,
              jitter: report.jitter,
              audioLevel: (report as any).audioLevel,
            });
          }
        });
      } catch (e) {
        // ignore
      }
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
      } catch (e) {
        // ignore
      }
      this.peerConnection = null;
    }
  }

  public cleanup(): void {
    console.log('[CALL] Cleaning up WebRTC session...');
    this.stopStatsLogging();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.localStream = null;
    }

    this.closePeerConnectionOnly();

    if (this.remoteAudioElement) {
      try {
        this.remoteAudioElement.pause();
        this.remoteAudioElement.srcObject = null;
      } catch (e) {}
    }

    this.pendingCandidates = [];
    this.onIceCandidateCallback = null;
    this.onConnectionStateCallback = null;
    this.onAutoplayBlockedCallback = null;
    this.onErrorCallback = null;
  }
}

export const webrtcService = new WebRTCService();
