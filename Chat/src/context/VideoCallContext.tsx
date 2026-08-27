/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, CallLog, CallStatus } from '../types/chat.types';
import type {
  VideoCallSession,
  WSVideoCallOfferData,
  WSVideoCallAnswerData,
  WSVideoIceCandidateData,
  WSVideoCallRejectData,
  WSVideoCallCancelData,
  WSVideoCallEndData,
  WSVideoCallBusyData,
} from '../types/video-call.types';
import { videoWebRTCService } from '../services/video-webrtc.service';
import { webSocketService } from '../services/websocket.service';
import { useAuth } from './AuthContext';

interface VideoCallContextType {
  videoCallSession: VideoCallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startVideoCall: (receiver: User) => Promise<void>;
  acceptVideoCall: () => Promise<void>;
  rejectVideoCall: () => void;
  cancelVideoCall: () => void;
  endVideoCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
}

export const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

// Web Audio API Ringtone Generator (Audio context safe)
class VideoRingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playOutgoing(): void {
    this.stop();
    const playTone = () => {
      try {
        const ctx = this.getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.4);
      } catch (e) {}
    };
    playTone();
    this.intervalId = setInterval(playTone, 3500);
  }

  public playIncoming(): void {
    this.stop();
    const playChime = () => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;
        [587.33, 739.99, 880.0, 1174.66].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.14);
          gain.gain.setValueAtTime(0.12, now + i * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.14);
          osc.stop(now + i * 0.14 + 0.45);
        });
      } catch (e) {}
    };
    playChime();
    this.intervalId = setInterval(playChime, 2500);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const ringtone = new VideoRingtonePlayer();

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [videoCallSession, setVideoCallSession] = useState<VideoCallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pendingOfferSdpRef = useRef<RTCSessionDescriptionInit | string | null>(null);
  const timerRef = useRef<any>(null);
  const cleanupTimerRef = useRef<any>(null);

  // Helper to record call log in shared call history
  const recordVideoCallLog = useCallback(
    (session: VideoCallSession) => {
      let status: CallStatus = 'ended';
      if (session.isCaller) {
        status = 'outgoing';
      } else {
        if (session.durationSec > 0 || session.state === 'connected' || session.state === 'ended') {
          status = 'incoming';
        } else {
          status = 'missed';
        }
      }

      const formatLogDuration = (secs: number) => {
        if (secs <= 0) return undefined;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
      };

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newLog: CallLog = {
        id: `vlog_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        contactId: String(session.counterparty.id),
        contact: session.counterparty,
        type: 'video',
        status,
        timestamp: timeStr,
        duration: formatLogDuration(session.durationSec),
      };

      try {
        const key = authUser ? `chat_call_history_${authUser.id}` : 'chat_call_history';
        const saved = localStorage.getItem(key);
        const existing: CallLog[] = saved ? JSON.parse(saved) : [];
        const updated = [newLog, ...existing].slice(0, 100);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {}
    },
    [authUser]
  );

  const cleanCallAfterDelay = useCallback(
    (delayMs: number = 2000) => {
      ringtone.stop();
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }

      setVideoCallSession((current) => {
        if (current && current.counterparty) {
          recordVideoCallLog(current);
        }
        return current;
      });

      cleanupTimerRef.current = setTimeout(() => {
        videoWebRTCService.cleanup();
        setVideoCallSession(null);
        setLocalStream(null);
        setRemoteStream(null);
        pendingOfferSdpRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }, delayMs);
    },
    [recordVideoCallLog]
  );

  // Duration Timer (counts ONLY when state is 'connected')
  useEffect(() => {
    if (videoCallSession?.state === 'connected') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setVideoCallSession((prev) => (prev ? { ...prev, durationSec: prev.durationSec + 1 } : null));
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [videoCallSession?.state]);

  // Handle incoming video signaling events from WebSocket
  useEffect(() => {
    const unsubOffer = webSocketService.on<WSVideoCallOfferData>('VIDEO_CALL_OFFER', (data) => {
      console.log('[VIDEO_SIGNALING] Received video call offer from user:', data.caller_id, 'call_id:', data.call_id);
      if (videoCallSession && ['calling', 'ringing', 'connecting', 'connected'].includes(videoCallSession.state)) {
        console.log('[VIDEO_SIGNALING] Busy: already in active video call session, sending video_call_busy');
        webSocketService.sendSignaling({
          type: 'video_call_busy',
          call_id: data.call_id,
        });
        return;
      }

      pendingOfferSdpRef.current = data.sdp;
      const caller: User = {
        id: String(data.caller_id),
        name: data.caller_name || `User ${data.caller_id}`,
        email: '',
        avatar: data.caller_avatar || '',
        status: 'online',
        about: '',
        phone: '',
      };

      setVideoCallSession({
        callId: data.call_id,
        counterparty: caller,
        isCaller: false,
        state: 'ringing',
        isMuted: false,
        isCameraOff: false,
        durationSec: 0,
        statusMessage: 'Incoming video call...',
        isAudioBlocked: false,
      });
      ringtone.playIncoming();
    });

    const unsubAnswer = webSocketService.on<WSVideoCallAnswerData>('VIDEO_CALL_ANSWER', async (data) => {
      console.log('[VIDEO_SIGNALING] Received video call answer for call_id:', data.call_id);
      ringtone.stop();
      try {
        setVideoCallSession((prev) =>
          prev && prev.callId === data.call_id
            ? { ...prev, state: 'connecting', statusMessage: 'Connecting video...' }
            : prev
        );
        await videoWebRTCService.handleAnswer(data.sdp);
      } catch (err: any) {
        console.error('[VIDEO_WEBRTC] Failed to handle answer SDP:', err);
        setVideoCallSession((prev) =>
          prev ? { ...prev, state: 'failed', error: err.message, statusMessage: 'Connection failed' } : null
        );
        cleanCallAfterDelay(3000);
      }
    });

    const unsubCandidate = webSocketService.on<WSVideoIceCandidateData>('VIDEO_ICE_CANDIDATE', async (data) => {
      if (data.candidate) {
        await videoWebRTCService.addIceCandidate(data.candidate);
      }
    });

    const unsubReject = webSocketService.on<WSVideoCallRejectData>('VIDEO_CALL_REJECT', (data) => {
      console.log('[VIDEO_SIGNALING] Received video call reject for call_id:', data.call_id);
      setVideoCallSession((prev) =>
        prev && prev.callId === data.call_id
          ? { ...prev, state: 'rejected', statusMessage: 'Call declined' }
          : prev
      );
      cleanCallAfterDelay(2000);
    });

    const unsubCancel = webSocketService.on<WSVideoCallCancelData>('VIDEO_CALL_CANCEL', (data) => {
      console.log('[VIDEO_SIGNALING] Received video call cancel for call_id:', data.call_id);
      setVideoCallSession((prev) =>
        prev && prev.callId === data.call_id
          ? { ...prev, state: 'cancelled', statusMessage: 'Call cancelled' }
          : prev
      );
      cleanCallAfterDelay(1500);
    });

    const unsubBusy = webSocketService.on<WSVideoCallBusyData>('VIDEO_CALL_BUSY', (data) => {
      console.log('[VIDEO_SIGNALING] Received video call busy for call_id:', data.call_id);
      setVideoCallSession((prev) =>
        prev
          ? { ...prev, state: 'busy', statusMessage: data.message || 'User is busy on another call' }
          : prev
      );
      cleanCallAfterDelay(2500);
    });

    const unsubEnd = webSocketService.on<WSVideoCallEndData>('VIDEO_CALL_END', (data) => {
      console.log('[VIDEO_SIGNALING] Received video call end for call_id:', data.call_id);
      setVideoCallSession((prev) =>
        prev && prev.callId === data.call_id
          ? { ...prev, state: 'ended', statusMessage: 'Video call ended' }
          : prev
      );
      cleanCallAfterDelay(1500);
    });

    return () => {
      unsubOffer();
      unsubAnswer();
      unsubCandidate();
      unsubReject();
      unsubCancel();
      unsubBusy();
      unsubEnd();
    };
  }, [videoCallSession, cleanCallAfterDelay]);

  // Start outgoing video call
  const startVideoCall = useCallback(
    async (receiver: User) => {
      if (!authUser) return;
      ringtone.stop();
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);

      const callId = `vcall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('[VIDEO_CALL] Starting outgoing video call to:', receiver.name, 'id:', receiver.id, 'callId:', callId);

      setVideoCallSession({
        callId,
        counterparty: receiver,
        isCaller: true,
        state: 'calling',
        isMuted: false,
        isCameraOff: false,
        durationSec: 0,
        statusMessage: 'Calling...',
        isAudioBlocked: false,
      });
      ringtone.playOutgoing();

      try {
        const stream = await videoWebRTCService.getLocalMediaStream();
        setLocalStream(stream);

        const match = String(receiver.id).match(/\d+/);
        const numericReceiverId = match ? parseInt(match[0], 10) : receiver.id;

        await videoWebRTCService.initializePeerConnection(
          (candidate) => {
            webSocketService.sendSignaling({
              type: 'video_ice_candidate',
              call_id: callId,
              candidate,
            });
          },
          (state) => {
            console.log('[VIDEO_WEBRTC] Connection state update:', state);
            if (state === 'connected') {
              ringtone.stop();
              setVideoCallSession((prev) =>
                prev && prev.callId === callId
                  ? { ...prev, state: 'connected', statusMessage: 'Connected' }
                  : prev
              );
            } else if (state === 'failed' || state === 'disconnected') {
              setVideoCallSession((prev) =>
                prev && prev.callId === callId
                  ? { ...prev, state: 'failed', statusMessage: 'Connection failed' }
                  : prev
              );
              cleanCallAfterDelay(2500);
            }
          },
          (rStream) => {
            console.log('[VIDEO_WEBRTC] Setting remote video stream in state');
            setRemoteStream(rStream);
          },
          (isBlocked) => {
            setVideoCallSession((prev) => (prev ? { ...prev, isAudioBlocked: isBlocked } : null));
          },
          (err) => {
            console.error('[VIDEO_WEBRTC] Peer connection error:', err);
            setVideoCallSession((prev) =>
              prev && prev.callId === callId
                ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message }
                : prev
            );
            cleanCallAfterDelay(3000);
          }
        );

        const offer = await videoWebRTCService.createOffer();

        webSocketService.sendSignaling({
          type: 'video_call_offer',
          call_id: callId,
          receiver_id: numericReceiverId,
          sdp: offer,
        });
      } catch (err: any) {
        console.error('[VIDEO_CALL] Failed to initiate video call:', err);
        ringtone.stop();
        setVideoCallSession((prev) =>
          prev
            ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message }
            : null
        );
        cleanCallAfterDelay(3000);
      }
    },
    [authUser, cleanCallAfterDelay]
  );

  // Accept incoming video call
  const acceptVideoCall = useCallback(async () => {
    if (!videoCallSession || videoCallSession.isCaller || !pendingOfferSdpRef.current) return;
    ringtone.stop();

    console.log('[VIDEO_CALL] Accepting incoming video call for callId:', videoCallSession.callId);
    setVideoCallSession((prev) => (prev ? { ...prev, state: 'connecting', statusMessage: 'Connecting video...' } : null));

    try {
      const stream = await videoWebRTCService.getLocalMediaStream();
      setLocalStream(stream);

      await videoWebRTCService.initializePeerConnection(
        (candidate) => {
          webSocketService.sendSignaling({
            type: 'video_ice_candidate',
            call_id: videoCallSession.callId,
            candidate,
          });
        },
        (state) => {
          console.log('[VIDEO_WEBRTC] Receiver connection state update:', state);
          if (state === 'connected') {
            setVideoCallSession((prev) =>
              prev ? { ...prev, state: 'connected', statusMessage: 'Connected' } : null
            );
          } else if (state === 'failed' || state === 'disconnected') {
            setVideoCallSession((prev) =>
              prev ? { ...prev, state: 'failed', statusMessage: 'Connection lost' } : null
            );
            cleanCallAfterDelay(2500);
          }
        },
        (rStream) => {
          console.log('[VIDEO_WEBRTC] Setting remote video stream in state');
          setRemoteStream(rStream);
        },
        (isBlocked) => {
          setVideoCallSession((prev) => (prev ? { ...prev, isAudioBlocked: isBlocked } : null));
        },
        (err) => {
          console.error('[VIDEO_WEBRTC] Error during call acceptance:', err);
          setVideoCallSession((prev) =>
            prev ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message } : null
          );
          cleanCallAfterDelay(3000);
        }
      );

      const answer = await videoWebRTCService.handleOfferAndCreateAnswer(pendingOfferSdpRef.current);

      webSocketService.sendSignaling({
        type: 'video_call_answer',
        call_id: videoCallSession.callId,
        sdp: answer,
      });
    } catch (err: any) {
      console.error('[VIDEO_CALL] Failed to accept video call:', err);
      setVideoCallSession((prev) =>
        prev ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message } : null
      );
      cleanCallAfterDelay(3000);
    }
  }, [videoCallSession, cleanCallAfterDelay]);

  // Reject incoming video call
  const rejectVideoCall = useCallback(() => {
    if (!videoCallSession) return;
    ringtone.stop();
    console.log('[VIDEO_CALL] Rejecting video call for callId:', videoCallSession.callId);
    webSocketService.sendSignaling({
      type: 'video_call_reject',
      call_id: videoCallSession.callId,
    });
    setVideoCallSession((prev) => (prev ? { ...prev, state: 'rejected', statusMessage: 'Call rejected' } : null));
    cleanCallAfterDelay(500);
  }, [videoCallSession, cleanCallAfterDelay]);

  // Cancel outgoing video call
  const cancelVideoCall = useCallback(() => {
    if (!videoCallSession) return;
    ringtone.stop();
    console.log('[VIDEO_CALL] Cancelling video call for callId:', videoCallSession.callId);
    webSocketService.sendSignaling({
      type: 'video_call_cancel',
      call_id: videoCallSession.callId,
    });
    setVideoCallSession((prev) => (prev ? { ...prev, state: 'cancelled', statusMessage: 'Call cancelled' } : null));
    cleanCallAfterDelay(500);
  }, [videoCallSession, cleanCallAfterDelay]);

  // End active video call
  const endVideoCall = useCallback(() => {
    if (!videoCallSession) return;
    ringtone.stop();
    console.log('[VIDEO_CALL] Ending video call for callId:', videoCallSession.callId);
    webSocketService.sendSignaling({
      type: 'video_call_end',
      call_id: videoCallSession.callId,
    });
    setVideoCallSession((prev) => (prev ? { ...prev, state: 'ended', statusMessage: 'Call ended' } : null));
    cleanCallAfterDelay(500);
  }, [videoCallSession, cleanCallAfterDelay]);

  // Toggle microphone mute
  const toggleMute = useCallback(() => {
    setVideoCallSession((prev) => {
      if (!prev) return null;
      const nextMuted = !prev.isMuted;
      videoWebRTCService.setMute(nextMuted);
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  // Toggle camera disable/enable
  const toggleCamera = useCallback(() => {
    setVideoCallSession((prev) => {
      if (!prev) return null;
      const nextCameraOff = !prev.isCameraOff;
      videoWebRTCService.setCameraOff(nextCameraOff);
      return { ...prev, isCameraOff: nextCameraOff };
    });
  }, []);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    const newStream = await videoWebRTCService.switchCamera();
    if (newStream) {
      setLocalStream(new MediaStream(newStream.getTracks()));
    }
  }, []);

  return (
    <VideoCallContext.Provider
      value={{
        videoCallSession,
        localStream,
        remoteStream,
        startVideoCall,
        acceptVideoCall,
        rejectVideoCall,
        cancelVideoCall,
        endVideoCall,
        toggleMute,
        toggleCamera,
        switchCamera,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};
