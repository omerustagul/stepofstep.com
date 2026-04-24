import { Outlet } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import AdminBar from '../layout/AdminBar';

import DynamicBackground from '../common/DynamicBackground';

import MobileNavbar from './MobileNavbar';
import FloatingWheelButton from '../common/FloatingWheelButton';

const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] selection:bg-orange-500/30 overflow-x-hidden relative md:pb-0 transition-colors duration-300">
            <DynamicBackground />
            <AdminBar />
            <Navbar />
            <MobileNavbar />
            <FloatingWheelButton />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
