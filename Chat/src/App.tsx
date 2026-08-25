import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { AppRoutes } from './routes/AppRoutes';
import { CallOverlay } from './components/common/CallOverlay';
import { MediaViewer } from './components/common/MediaViewer';
import { NewChatModal } from './components/modals/NewChatModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { SettingsModal } from './components/modals/SettingsModal';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <div className="h-screen w-screen overflow-y-auto bg-gray-100 dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 font-sans antialiased">
            <AppRoutes />

            {/* Global Overlays & Modals */}
            <CallOverlay />
            <MediaViewer />
            <NewChatModal />
            <ProfileModal />
            <SettingsModal />
          </div>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
