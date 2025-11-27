import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

const Login = () => {
  const { login, loading } = useAuth();

  const handleSubmit = async (credentials) => {
    try {
      await login(credentials);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login failed', error);
    }
  };

  return (
    <section>
      <h1>Admin login</h1>
      {loading && <p>Authenticating...</p>}
      <LoginForm onSubmit={handleSubmit} />
    </section>
  );
};

export default Login;
