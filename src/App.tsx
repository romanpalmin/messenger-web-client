import { useState } from 'react';
import type { Credentials } from './api/types';
import { ChatApp } from './features/chat/ChatApp';
import { ThemeToggle } from './features/theme/ThemeToggle';
import { LoginForm } from './features/login/LoginForm';
import { clearCredentials, loadCredentials, saveCredentials } from './features/login/session';

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials());

  return (
    <>
      <ThemeToggle />
      {credentials ? (
        <ChatApp
          credentials={credentials}
          onLogout={() => {
            clearCredentials();
            setCredentials(null);
          }}
        />
      ) : (
        <LoginForm
          onLogin={(value) => {
            saveCredentials(value);
            setCredentials(value);
          }}
        />
      )}
    </>
  );
}
