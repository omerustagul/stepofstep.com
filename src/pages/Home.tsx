
import ModernHero from '../components/hero/ModernHero';
import Services from '../components/home/Services';
import Portfolio from '../components/home/Portfolio';
import Contact from '../components/home/Contact';
import SEO from '../components/common/SEO';
import { useSiteSettings } from '../context/SiteContext';
import AppointmentCTA from '../components/home/AppointmentCTA';


const Home = () => {
    // const [isBookingOpen, setIsBookingOpen] = useState(false); // Removed from here since it's now in separate component

    const { getPagePath } = useSiteSettings();

    return (
        <div className="w-full bg-[rgb(var(--bg-primary))] transition-colors duration-300">
            <SEO path={getPagePath('Ana Sayfa', '/')} />
            {/* <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />  Removed */}
            {/* <WheelOfFortune /> removed, moved to Public Layout */}

            {/* MODERN HERO SECTION (Replaced Zero-G) */}
            <ModernHero />

            <Services />

            <Portfolio />

            <Contact />

            <AppointmentCTA />

            {/* FLOATING WHEEL BUTTON - Moved to PublicLayout/FloatingWheelButton */}
        </div>
    );
};

export default Home;
