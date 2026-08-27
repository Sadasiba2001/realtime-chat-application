import type { User } from './chat.types';

export type CallState =
  | 'idle'
  | 'calling'       // Outgoing: calling receiver
  | 'ringing'       // Incoming: receiving incoming call
  | 'connecting'    // Exchanging WebRTC SDP & ICE
  | 'connected'     // Audio flowing
  | 'rejected'      // Receiver rejected
  | 'busy'          // Receiver busy
  | 'cancelled'     // Caller cancelled before answer
  | 'ended'         // Call ended normally
  | 'failed';       // Connection failed / mic permission error

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface CallSession {
  callId: string;
  counterparty: User;
  isCaller: boolean;
  state: CallState;
  isMuted: boolean;
  durationSec: number;
  statusMessage?: string;
  isAudioBlocked?: boolean;
  error?: string;
}

export interface WSVoiceCallOfferData {
  type: 'call_offer';
  call_id: string;
  caller_id: number | string;
  caller_name: string;
  caller_avatar?: string;
  sdp: RTCSessionDescriptionInit | string;
}

export interface WSVoiceCallAnswerData {
  type: 'call_answer';
  call_id: string;
  receiver_id: number | string;
  sdp: RTCSessionDescriptionInit | string;
}

export interface WSVoiceIceCandidateData {
  type: 'ice_candidate';
  call_id: string;
  candidate: RTCIceCandidateInit;
  sender_id?: number | string;
}

export interface WSVoiceCallRejectData {
  type: 'call_reject';
  call_id: string;
  receiver_id?: number | string;
}

export interface WSVoiceCallCancelData {
  type: 'call_cancel';
  call_id: string;
  caller_id?: number | string;
}

export interface WSVoiceCallEndData {
  type: 'call_end';
  call_id: string;
  ended_by?: number | string;
}

export interface WSVoiceCallBusyData {
  type: 'call_busy';
  call_id?: string;
  user_id?: number | string;
  message?: string;
}

export interface WSVoiceCallInitiatedData {
  type: 'call_initiated';
  call_id: string;
  receiver_id: number | string;
  status: string;
}

export interface WSVoiceCallConnectedData {
  type: 'call_connected';
  call_id: string;
  status: string;
}

export type WSVoiceSignalingEvent =
  | WSVoiceCallOfferData
  | WSVoiceCallAnswerData
  | WSVoiceIceCandidateData
  | WSVoiceCallRejectData
  | WSVoiceCallCancelData
  | WSVoiceCallEndData
  | WSVoiceCallBusyData
  | WSVoiceCallInitiatedData
  | WSVoiceCallConnectedData;
