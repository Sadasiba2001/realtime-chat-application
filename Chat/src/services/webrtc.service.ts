import { apiClient } from './api.client';

export type IceCandidateCallback = (candidate: RTCIceCandidateInit) => void;
export type ConnectionStateCallback = (state: RTCPeerConnectionState) => void;
export type ErrorCallback = (error: Error) => void;

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private onIceCandidateCallback: IceCandidateCallback | null = null;
  private onConnectionStateCallback: ConnectionStateCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;

  public async fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await apiClient.get('/api/v1/voice/ice-servers/');
      const data = response.data;
      if (data && Array.isArray(data.ice_servers) && data.ice_servers.length > 0) {
        return data.ice_servers;
      }
    } catch (err) {
      console.warn('[WebRTC] Could not fetch ICE servers from backend, using defaults:', err);
    }
    return DEFAULT_ICE_SERVERS;
  }

  public async getLocalAudioStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC is not supported in this browser.');
    }

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
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Failed to access microphone:', err);
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
    onError: ErrorCallback
  ): Promise<RTCPeerConnection> {
    this.cleanup();

    this.onIceCandidateCallback = onIceCandidate;
    this.onConnectionStateCallback = onConnectionStateChange;
    this.onErrorCallback = onError;

    const iceServers = await this.fetchIceServers();

    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 2,
    });

    this.peerConnection = pc;

    // Add local audio track
    const localStream = await this.getLocalAudioStream();
    localStream.getAudioTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Handle remote tracks
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        this.attachRemoteStream(event.streams[0]);
      } else if (event.track) {
        const inboundStream = new MediaStream([event.track]);
        this.attachRemoteStream(inboundStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate.toJSON());
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      console.log('[WebRTC] Connection state changed:', state);
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(state);
      }
      if (state === 'failed' && this.onErrorCallback) {
        this.onErrorCallback(new Error('WebRTC connection failed.'));
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!this.peerConnection) return;
      console.log('[WebRTC] ICE connection state:', this.peerConnection.iceConnectionState);
    };

    return pc;
  }

  private attachRemoteStream(stream: MediaStream): void {
    if (!this.remoteAudioElement) {
      this.remoteAudioElement = new Audio();
      this.remoteAudioElement.autoplay = true;
      this.remoteAudioElement.style.display = 'none';
      document.body.appendChild(this.remoteAudioElement);
    }

    this.remoteAudioElement.srcObject = stream;
    this.remoteAudioElement.play().catch((err) => {
      console.warn('[WebRTC] Auto-play was prevented by browser policy:', err);
    });
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });

    await this.peerConnection.setLocalDescription(offer);
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

    await this.peerConnection.setRemoteDescription(sessionDesc);
    await this.processPendingIceCandidates();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
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

    await this.peerConnection.setRemoteDescription(sessionDesc);
    await this.processPendingIceCandidates();
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
      } catch (err) {
        console.warn('[WebRTC] Error adding ICE candidate:', err);
      }
    } else {
      this.iceCandidateQueue.push(candidateInit);
    }
  }

  private async processPendingIceCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;

    while (this.iceCandidateQueue.length > 0) {
      const candidateInit = this.iceCandidateQueue.shift();
      if (candidateInit) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (err) {
          console.warn('[WebRTC] Error adding queued ICE candidate:', err);
        }
      }
    }
  }

  public setMute(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  public cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {
        // ignore
      }
      this.peerConnection = null;
    }

    if (this.remoteAudioElement) {
      try {
        this.remoteAudioElement.pause();
        this.remoteAudioElement.srcObject = null;
        this.remoteAudioElement.remove();
      } catch (e) {
        // ignore
      }
      this.remoteAudioElement = null;
    }

    this.iceCandidateQueue = [];
    this.onIceCandidateCallback = null;
    this.onConnectionStateCallback = null;
    this.onErrorCallback = null;
  }
}

export const webrtcService = new WebRTCService();
