import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';
import { AdminPortal } from './views/admin/AdminPortal';
import { TrainerPortal } from './views/trainer/TrainerPortal';
import { StudentPortal } from './views/student/StudentPortal';

function AppShell() {
  const { user, role } = useAuth();

  if (!user) {
    return <LoginView />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar activeBatchCode={user.batch_code} />
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
