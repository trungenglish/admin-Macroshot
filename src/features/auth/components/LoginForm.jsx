import { useState } from 'react';

const defaultState = { email: '', password: '' };

const LoginForm = ({ onSubmit }) => {
  const [formState, setFormState] = useState(defaultState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label>
        Email
        <input name="email" type="email" value={formState.email} onChange={handleChange} />
      </label>
      <label>
        Password
        <input name="password" type="password" value={formState.password} onChange={handleChange} />
      </label>
      <button type="submit">Sign in</button>
    </form>
  );
};

export default LoginForm;
