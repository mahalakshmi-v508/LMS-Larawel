import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { AdminPortal } from './views/admin/AdminPortal';
import { TrainerPortal } from './views/trainer/TrainerPortal';
import { StudentPortal } from './views/student/StudentPortal';
import { PublicWebsite, type PublicPage } from './views/PublicWebsite';

function getCurrentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function AppShell() {
  const { user, role } = useAuth();
  const path = getCurrentPath();
  const publicPages: Record<string, PublicPage> = {
    '/': 'home',
    '/about': 'about',
    '/enquiry': 'enquiry',
  };

  useEffect(() => {
    if (user && role && (path === '/login' || path.startsWith('/portal/'))) {
      const portalPath = `/portal/${role.toLowerCase()}`;
      if (path !== portalPath) {
        window.history.replaceState(null, '', portalPath);
      }
    }
  }, [path, role, user]);

  // Keep the public website independent from an authenticated portal session.
  if (path in publicPages) {
    return <PublicWebsite page={publicPages[path]} />;
  }

  if (!user) {
    return <LoginView onBack={() => window.location.assign('/')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {role === 'ADMIN' && <AdminPortal />}
      {role === 'TRAINER' && <TrainerPortal />}
      {role === 'STUDENT' && <StudentPortal />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App
