const UserMenu = ({ user }) => {
  if (!user) {
    return null;
  }

  return (
    <div className="user-menu">
      <span>{user.email}</span>
      <button type="button">Logout</button>
    </div>
  );
};

export default UserMenu;
