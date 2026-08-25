/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/chat.types';
import type {
  CallSession,
  WSVoiceCallOfferData,
  WSVoiceCallAnswerData,
  WSVoiceIceCandidateData,
  WSVoiceCallRejectData,
  WSVoiceCallCancelData,
  WSVoiceCallEndData,
  WSVoiceCallBusyData,
} from '../types/call.types';
import { webrtcService } from '../services/webrtc.service';
import { webSocketService } from '../services/websocket.service';
import { useAuth } from './AuthContext';

interface VoiceCallContextType {
  callSession: CallSession | null;
  startCall: (receiver: User) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

export const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

// Web Audio API Ringtone Generator (Zero external dependencies)
class RingtonePlayer {
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
    const playBeep = () => {
      try {
        const ctx = this.getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch (e) {
        // audio context blocked by browser
      }
    };
    playBeep();
    this.intervalId = setInterval(playBeep, 3500);
  }

  public playIncoming(): void {
    this.stop();
    const playChime = () => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          gain.gain.setValueAtTime(0.12, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.4);
        });
      } catch (e) {
        // audio context blocked by browser
      }
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

const ringtone = new RingtonePlayer();

export const VoiceCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const pendingOfferSdpRef = useRef<RTCSessionDescriptionInit | string | null>(null);
  const timerRef = useRef<any>(null);
  const cleanupTimerRef = useRef<any>(null);

  const cleanCallAfterDelay = useCallback((delayMs: number = 2000) => {
    ringtone.stop();
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
    cleanupTimerRef.current = setTimeout(() => {
      webrtcService.cleanup();
      setCallSession(null);
      pendingOfferSdpRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, delayMs);
  }, []);

  // Duration Timer
  useEffect(() => {
    if (callSession?.state === 'connected') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setCallSession((prev) => (prev ? { ...prev, durationSec: prev.durationSec + 1 } : null));
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
  }, [callSession?.state]);

  // Handle incoming signaling events from WebSocket
  useEffect(() => {
    const unsubOffer = webSocketService.on<WSVoiceCallOfferData>('VOICE_CALL_OFFER', (data) => {
      console.log('[VoiceCall] Received call offer:', data);
      if (callSession && ['calling', 'ringing', 'connecting', 'connected'].includes(callSession.state)) {
        // Send busy response
        webSocketService.sendSignaling({
          type: 'call_busy',
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

      setCallSession({
        callId: data.call_id,
        counterparty: caller,
        isCaller: false,
        state: 'ringing',
        isMuted: false,
        durationSec: 0,
        statusMessage: 'Incoming call...',
      });
      ringtone.playIncoming();
    });

    const unsubAnswer = webSocketService.on<WSVoiceCallAnswerData>('VOICE_CALL_ANSWER', async (data) => {
      console.log('[VoiceCall] Received call answer:', data);
      ringtone.stop();
      try {
        await webrtcService.handleAnswer(data.sdp);
        setCallSession((prev) =>
          prev && prev.callId === data.call_id
            ? { ...prev, state: 'connected', statusMessage: 'Connected' }
            : prev
        );
      } catch (err: any) {
        console.error('[VoiceCall] Failed to handle answer SDP:', err);
        setCallSession((prev) =>
          prev ? { ...prev, state: 'failed', error: err.message, statusMessage: 'Connection failed' } : null
        );
        cleanCallAfterDelay(3000);
      }
    });

    const unsubCandidate = webSocketService.on<WSVoiceIceCandidateData>('VOICE_ICE_CANDIDATE', async (data) => {
      if (data.candidate) {
        await webrtcService.addIceCandidate(data.candidate);
      }
    });

    const unsubReject = webSocketService.on<WSVoiceCallRejectData>('VOICE_CALL_REJECT', (data) => {
      console.log('[VoiceCall] Received call reject:', data);
      setCallSession((prev) =>
        prev && prev.callId === data.call_id
          ? { ...prev, state: 'rejected', statusMessage: 'Call declined' }
          : prev
      );
      cleanCallAfterDelay(2000);
    });

    const unsubCancel = webSocketService.on<WSVoiceCallCancelData>('VOICE_CALL_CANCEL', (data) => {
      console.log('[VoiceCall] Received call cancel:', data);
      setCallSession((prev) =>
        prev && prev.callId === data.call_id
          ? { ...prev, state: 'cancelled', statusMessage: 'Call cancelled' }
          : prev
      );
      cleanCallAfterDelay(1500);
    });

    const unsubBusy = webSocketService.on<WSVoiceCallBusyData>('VOICE_CALL_BUSY', (data) => {
      console.log('[VoiceCall] Received call busy:', data);
      setCallSession((prev) =>
        prev
          ? { ...prev, state: 'busy', statusMessage: data.message || 'User is busy on another call' }
          : prev
      );
      cleanCallAfterDelay(2500);
    });

    const unsubEnd = webSocketService.on<WSVoiceCallEndData>('VOICE_CALL_END', (data) => {
      console.log('[VoiceCall] Received call end:', data);
      setCallSession((prev) =>
        prev && prev.callId === data.call_id
          ? { ...prev, state: 'ended', statusMessage: 'Call ended' }
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
  }, [callSession, cleanCallAfterDelay]);

  // Start outgoing call
  const startCall = useCallback(
    async (receiver: User) => {
      if (!authUser) return;
      ringtone.stop();
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);

      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setCallSession({
        callId,
        counterparty: receiver,
        isCaller: true,
        state: 'calling',
        isMuted: false,
        durationSec: 0,
        statusMessage: 'Calling...',
      });
      ringtone.playOutgoing();

      try {
        // Clean number from receiver ID
        const match = String(receiver.id).match(/\d+/);
        const numericReceiverId = match ? parseInt(match[0], 10) : receiver.id;

        await webrtcService.initializePeerConnection(
          (candidate) => {
            webSocketService.sendSignaling({
              type: 'ice_candidate',
              call_id: callId,
              candidate,
            });
          },
          (state) => {
            if (state === 'connected') {
              ringtone.stop();
              setCallSession((prev) =>
                prev && prev.callId === callId
                  ? { ...prev, state: 'connected', statusMessage: 'Connected' }
                  : prev
              );
            } else if (state === 'failed' || state === 'disconnected') {
              setCallSession((prev) =>
                prev && prev.callId === callId
                  ? { ...prev, state: 'failed', statusMessage: 'Connection failed' }
                  : prev
              );
              cleanCallAfterDelay(2500);
            }
          },
          (err) => {
            console.error('[VoiceCall] Peer connection error:', err);
            setCallSession((prev) =>
              prev && prev.callId === callId
                ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message }
                : prev
            );
            cleanCallAfterDelay(3000);
          }
        );

        const offer = await webrtcService.createOffer();

        webSocketService.sendSignaling({
          type: 'call_offer',
          call_id: callId,
          receiver_id: numericReceiverId,
          sdp: offer,
        });
      } catch (err: any) {
        console.error('[VoiceCall] Failed to initiate call:', err);
        ringtone.stop();
        setCallSession((prev) =>
          prev
            ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message }
            : null
        );
        cleanCallAfterDelay(3000);
      }
    },
    [authUser, cleanCallAfterDelay]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!callSession || callSession.isCaller || !pendingOfferSdpRef.current) return;
    ringtone.stop();

    setCallSession((prev) => (prev ? { ...prev, state: 'connecting', statusMessage: 'Connecting...' } : null));

    try {
      await webrtcService.initializePeerConnection(
        (candidate) => {
          webSocketService.sendSignaling({
            type: 'ice_candidate',
            call_id: callSession.callId,
            candidate,
          });
        },
        (state) => {
          if (state === 'connected') {
            setCallSession((prev) =>
              prev ? { ...prev, state: 'connected', statusMessage: 'Connected' } : null
            );
          } else if (state === 'failed' || state === 'disconnected') {
            setCallSession((prev) =>
              prev ? { ...prev, state: 'failed', statusMessage: 'Connection lost' } : null
            );
            cleanCallAfterDelay(2500);
          }
        },
        (err) => {
          console.error('[VoiceCall] Error during call acceptance:', err);
          setCallSession((prev) =>
            prev ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message } : null
          );
          cleanCallAfterDelay(3000);
        }
      );

      const answer = await webrtcService.handleOfferAndCreateAnswer(pendingOfferSdpRef.current);

      webSocketService.sendSignaling({
        type: 'call_answer',
        call_id: callSession.callId,
        sdp: answer,
      });

      setCallSession((prev) => (prev ? { ...prev, state: 'connected', statusMessage: 'Connected' } : null));
    } catch (err: any) {
      console.error('[VoiceCall] Failed to accept call:', err);
      setCallSession((prev) =>
        prev ? { ...prev, state: 'failed', error: err.message, statusMessage: err.message } : null
      );
      cleanCallAfterDelay(3000);
    }
  }, [callSession, cleanCallAfterDelay]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!callSession) return;
    ringtone.stop();
    webSocketService.sendSignaling({
      type: 'call_reject',
      call_id: callSession.callId,
    });
    setCallSession((prev) => (prev ? { ...prev, state: 'rejected', statusMessage: 'Call rejected' } : null));
    cleanCallAfterDelay(500);
  }, [callSession, cleanCallAfterDelay]);

  // Cancel outgoing call
  const cancelCall = useCallback(() => {
    if (!callSession) return;
    ringtone.stop();
    webSocketService.sendSignaling({
      type: 'call_cancel',
      call_id: callSession.callId,
    });
    setCallSession((prev) => (prev ? { ...prev, state: 'cancelled', statusMessage: 'Call cancelled' } : null));
    cleanCallAfterDelay(500);
  }, [callSession, cleanCallAfterDelay]);

  // End active call
  const endCall = useCallback(() => {
    if (!callSession) return;
    ringtone.stop();
    webSocketService.sendSignaling({
      type: 'call_end',
      call_id: callSession.callId,
    });
    setCallSession((prev) => (prev ? { ...prev, state: 'ended', statusMessage: 'Call ended' } : null));
    cleanCallAfterDelay(500);
  }, [callSession, cleanCallAfterDelay]);

  // Toggle microphone mute
  const toggleMute = useCallback(() => {
    setCallSession((prev) => {
      if (!prev) return null;
      const nextMuted = !prev.isMuted;
      webrtcService.setMute(nextMuted);
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  return (
    <VoiceCallContext.Provider
      value={{
        callSession,
        startCall,
        acceptCall,
        rejectCall,
        cancelCall,
        endCall,
        toggleMute,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
};

export const useVoiceCall = () => {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error('useVoiceCall must be used within a VoiceCallProvider');
  }
  return context;
};
