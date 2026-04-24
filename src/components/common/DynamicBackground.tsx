import { motion } from 'framer-motion';

const DynamicBackground = () => {
    // We can use canvas or simple CSS blobs using Framer Motion. 
    // CSS blobs are more performant for simple blur effects.

    // Mobile Optimization: Return simple static gradient
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return (
            <div className="fixed inset-0 z-[-1] pointer-events-none bg-zinc-50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-100/40 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-100/40 to-transparent opacity-50" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-zinc-50/50">
            {/* Ambient Blobs */}

            {/* Top Right - Orange/Brand */}
            <motion.div
                animate={{
                    x: [0, 50, -50, 0],
                    y: [0, -30, 30, 0],
                    scale: [1, 1.1, 0.9, 1]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] bg-orange-400/10 rounded-full blur-[100px] mix-blend-multiply"
            />

            {/* Bottom Left - Blue/Accent */}
            <motion.div
                animate={{
                    x: [0, -30, 30, 0],
                    y: [0, 50, -50, 0],
                    scale: [1, 1.2, 0.8, 1]
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute -bottom-[10%] -left-[10%] w-[60vw] h-[60vw] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply"
            />

            {/* Center - Purple/Extra */}
            <motion.div
                animate={{
                    x: [0, 40, -40, 0],
                    y: [0, 40, -40, 0],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
                className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-purple-400/5 rounded-full blur-[90px] mix-blend-multiply"
            />
        </div>
    );
};

export default DynamicBackground;
