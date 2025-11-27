import AdminLayout from '../../layouts/AdminLayout.jsx';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import BlankLayout from '../../layouts/BlankLayout.jsx';
import Login from '../../features/auth/pages/Login.jsx';
import UserList from '../../features/users/pages/UserList.jsx';
import FoodList from '../../features/foods/pages/FoodList.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

const AppRoutes = () => {
  return (
    <BlankLayout>
      <AuthLayout>
        <Login />
      </AuthLayout>
      <ProtectedRoute>
        <AdminLayout>
          <UserList />
          <FoodList />
        </AdminLayout>
      </ProtectedRoute>
    </BlankLayout>
  );
};

export default AppRoutes;
