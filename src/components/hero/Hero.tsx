import { Suspense, lazy } from 'react';

// Lazy load the 3D scene to avoid blocking main bundle
const ZeroGScene = lazy(() => import('./ZeroGScene'));

const Hero = () => {
    return (
        <section className="relative w-full h-screen overflow-hidden bg-white">
            <Suspense
                fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <div className="text-2xl font-bold text-gray-200 animate-pulse">
                            LOADING VISION...
                        </div>
                    </div>
                }
            >
                <ZeroGScene />
            </Suspense>
        </section>
    );
};

export default Hero;
