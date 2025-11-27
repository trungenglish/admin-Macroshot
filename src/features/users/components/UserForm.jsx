import { useState } from 'react';

const UserForm = ({ defaultValue = {}, onSubmit }) => {
  const [formState, setFormState] = useState({
    email: defaultValue.email ?? '',
    role: defaultValue.role ?? 'user',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formState);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input name="email" value={formState.email} onChange={handleChange} />
      </label>
      <label>
        Role
        <select name="role" value={formState.role} onChange={handleChange}>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <button type="submit">Save user</button>
    </form>
  );
};

export default UserForm;
