import { useState } from 'react';
import type { Credentials } from './api/types';
import { LoginForm } from './features/login/LoginForm';
import { clearCredentials, loadCredentials, saveCredentials } from './features/login/session';

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials());

  if (!credentials) {
    return (
      <LoginForm
        onLogin={(value) => {
          saveCredentials(value);
          setCredentials(value);
        }}
      />
    );
  }

  return (
    <main>
      <p>Вы вошли в инстанс {credentials.idInstance}.</p>
      <button
        onClick={() => {
          clearCredentials();
          setCredentials(null);
        }}
      >
        Выйти
      </button>
    </main>
  );
}
