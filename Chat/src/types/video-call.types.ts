import type { User } from './chat.types';

export type VideoCallState =
  | 'idle'
  | 'calling'       // Outgoing: calling receiver
  | 'ringing'       // Incoming: receiving incoming call
  | 'connecting'    // Exchanging WebRTC SDP & ICE
  | 'connected'     // Video + audio media flowing
  | 'rejected'      // Receiver rejected
  | 'busy'          // Receiver busy
  | 'cancelled'     // Caller cancelled before answer
  | 'ended'         // Call ended normally
  | 'failed';       // Connection failed / media permission error

export interface VideoCallSession {
  callId: string;
  counterparty: User;
  isCaller: boolean;
  state: VideoCallState;
  isMuted: boolean;
  isCameraOff: boolean;
  durationSec: number;
  statusMessage?: string;
  isAudioBlocked?: boolean;
  error?: string;
}

export interface WSVideoCallOfferData {
  type: 'video_call_offer';
  call_id: string;
  caller_id: number | string;
  caller_name: string;
  caller_avatar?: string;
  sdp: RTCSessionDescriptionInit | string;
}

export interface WSVideoCallAnswerData {
  type: 'video_call_answer';
  call_id: string;
  receiver_id: number | string;
  sdp: RTCSessionDescriptionInit | string;
}

export interface WSVideoIceCandidateData {
  type: 'video_ice_candidate';
  call_id: string;
  candidate: RTCIceCandidateInit;
  sender_id?: number | string;
}

export interface WSVideoCallRejectData {
  type: 'video_call_reject';
  call_id: string;
  receiver_id: number | string;
  reason?: string;
}

export interface WSVideoCallCancelData {
  type: 'video_call_cancel';
  call_id: string;
  caller_id: number | string;
}

export interface WSVideoCallEndData {
  type: 'video_call_end';
  call_id: string;
  sender_id: number | string;
  reason?: string;
}

export interface WSVideoCallBusyData {
  type: 'video_call_busy';
  call_id: string;
  receiver_id: number | string;
  message?: string;
}
