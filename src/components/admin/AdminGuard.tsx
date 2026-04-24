import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
    children: JSX.Element;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Strict Role Check
    const allowedRoles = ['admin', 'marketing', 'designer'];
    const hasRoleAccess = allowedRoles.includes(user.role);
    const hasTeamAccess = !!user.role_id;

    if (!hasRoleAccess && !hasTeamAccess) {
        // User is logged in but has no admin rights
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminGuard;
