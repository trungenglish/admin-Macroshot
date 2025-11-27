import UserTable from '../components/UserTable.jsx';
import { useUserQuery } from '../hooks/useUserQuery.js';

const UserList = () => {
  const { users, loading } = useUserQuery();

  return (
    <section>
      <h2>Users</h2>
      {loading ? <p>Loading users...</p> : <UserTable data={users} />}
    </section>
  );
};

export default UserList;
