import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { VoiceCallProvider } from './context/VoiceCallContext';
import { VideoCallProvider } from './context/VideoCallContext';
import { AppRoutes } from './routes/AppRoutes';
import { CallOverlay } from './components/common/CallOverlay';
import { VoiceCallModal } from './components/calls/VoiceCallModal';
import { VideoCallModal } from './components/calls/VideoCallModal';
import { MediaViewer } from './components/common/MediaViewer';
import { NewChatModal } from './components/modals/NewChatModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MuteModal } from './components/chat/MuteModal';
import { ReportModal } from './components/chat/ReportModal';
import { ReportMessageModal } from './components/chat/ReportMessageModal';
import { ImagePreviewModal } from './components/chat/ImagePreviewModal';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <VoiceCallProvider>
            <VideoCallProvider>
              <div className="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 font-sans antialiased">
                <AppRoutes />

                {/* Global Overlays & Modals */}
                <VoiceCallModal />
                <VideoCallModal />
                <CallOverlay />
                <MediaViewer />
                <NewChatModal />
                <ProfileModal />
                <SettingsModal />
                <MuteModal />
                <ReportModal />
                <ReportMessageModal />
                <ImagePreviewModal />
              </div>
            </VideoCallProvider>
          </VoiceCallProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
