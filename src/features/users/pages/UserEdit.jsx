import UserForm from '../components/UserForm.jsx';

const UserEdit = () => {
  const handleSubmit = (payload) => {
    // eslint-disable-next-line no-console
    console.log('Persist user', payload);
  };

  return (
    <section>
      <h2>Edit user</h2>
      <UserForm onSubmit={handleSubmit} />
    </section>
  );
};

export default UserEdit;
