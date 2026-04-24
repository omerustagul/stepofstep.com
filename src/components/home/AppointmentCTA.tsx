import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Video, MapPin } from 'lucide-react';
import BookingModal from '../booking/BookingModal';

const AppointmentCTA = () => {
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    return (
        <section id="appointment-cta" className="py-20 bg-[rgb(var(--bg-primary))] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[rgb(var(--bg-secondary))] -z-20" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="relative bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden"
                >
                    {/* Glass Shine Effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                <Clock size={14} />
                                <span>Hızlı & Kolay Planlama</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-[rgb(var(--text-primary))] mb-6 leading-tight">
                                Projenizi <br />
                                <span className="text-orange-500">Yüz Yüze</span> Konuşalım.
                            </h2>

                            <p className="text-[rgb(var(--text-secondary))] text-lg mb-8 leading-relaxed max-w-md">
                                İster ofisimizde kahve eşliğinde, ister online toplantı ile fikirlerinizi hayata geçirmek için ilk adımı atın.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setIsBookingOpen(true)}
                                    className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/25 hover:scale-[1.02] flex items-center justify-center gap-3 text-lg group"
                                >
                                    <Calendar size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                                    <span>Randevu Oluştur</span>
                                    <ArrowRight size={20} className="opacity-60 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            {/* Decorative Cards */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-orange-400 to-red-500 rounded-full blur-[80px] opacity-20"
                            />

                            <div className="grid gap-4">
                                <div className="glass-panel p-6 rounded-3xl flex items-center gap-4 bg-[rgb(var(--bg-elevated))]/50 backdrop-blur-md border border-[rgb(var(--border-primary))]">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                        <Video size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[rgb(var(--text-primary))]">Online Görüşme</h4>
                                        <p className="text-xs text-[rgb(var(--text-secondary))]">Google Meet / Zoom</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-3xl flex items-center gap-4 bg-[rgb(var(--bg-elevated))]/50 backdrop-blur-md border border-[rgb(var(--border-primary))] ml-8">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[rgb(var(--text-primary))]">Ofiste Ziyaret</h4>
                                        <p className="text-xs text-[rgb(var(--text-secondary))]">İzmir Merkez Ofis</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
        </section>
    );
};

export default AppointmentCTA;
