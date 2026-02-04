import React from 'react';
import { motion } from 'framer-motion';

interface LandingPageProps {
    onStart: () => void;
    t: { [key: string]: string };
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, t }) => {
    return (
        <div className="flex flex-col h-[calc(100vh-80px)] px-4 pb-4 md:px-0 max-w-sm mx-auto md:max-w-4xl lg:max-w-6xl">
            {/* Hero Image Container */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-slate-200 w-full h-[55%] md:h-[65%] rounded-[2.5rem] overflow-hidden mb-6 md:mb-10 shadow-sm"
            >
                <img
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000"
                    alt="Travel Background"
                    className="w-full h-full object-cover"
                />
            </motion.div>

            <div className="flex flex-col flex-1 relative px-2">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                >
                    <h2 className="text-5xl md:text-7xl font-sans font-extrabold text-slate-900 leading-[0.95] tracking-tight uppercase mb-4 md:mb-8">
                        TRAVEL <br />
                        AROUND <br />
                        THE WORLD
                    </h2>
                </motion.div>

                <div className="mt-auto flex items-center justify-between">
                    {/* Pagination Dots */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex gap-2.5"
                    >
                        <div className="w-10 h-1.5 bg-slate-900 rounded-full"></div>
                        <div className="w-2.5 h-1.5 bg-slate-300 rounded-full"></div>
                        <div className="w-2.5 h-1.5 bg-slate-300 rounded-full"></div>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={onStart}
                        className="bg-peach hover:bg-peach-hover text-slate-900 font-bold px-10 py-5 rounded-[2.5rem] shadow-xl text-lg min-w-[180px] transition-colors"
                    >
                        Let's try!
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
