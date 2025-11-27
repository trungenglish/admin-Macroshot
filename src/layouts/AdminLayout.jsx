const AdminLayout = ({ children }) => {
  return (
    <main>
      <header>
        <h1>NutriPal Admin</h1>
      </header>
      <section>{children}</section>
    </main>
  );
};

export default AdminLayout;
