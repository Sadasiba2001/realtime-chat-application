import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { VoiceCallProvider } from './context/VoiceCallContext';
import { AppRoutes } from './routes/AppRoutes';
import { CallOverlay } from './components/common/CallOverlay';
import { VoiceCallModal } from './components/calls/VoiceCallModal';
import { MediaViewer } from './components/common/MediaViewer';
import { NewChatModal } from './components/modals/NewChatModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { SettingsModal } from './components/modals/SettingsModal';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <VoiceCallProvider>
            <div className="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 font-sans antialiased">
              <AppRoutes />

              {/* Global Overlays & Modals */}
              <VoiceCallModal />
              <CallOverlay />
              <MediaViewer />
              <NewChatModal />
              <ProfileModal />
              <SettingsModal />
            </div>
          </VoiceCallProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
