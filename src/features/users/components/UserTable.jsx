const UserTable = ({ data = [] }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {data.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;
