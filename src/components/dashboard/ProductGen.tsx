import { useState } from 'react';
import { Upload, Sparkles, Download, RefreshCw, Image } from 'lucide-react';

const ProductGen = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 2000); // Simulating generation
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Product Image Generator</h1>
                <p className="text-zinc-400">Transform your product photos into professional marketing assets.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-4xl space-y-4 bg-white/50">
                        <h3 className="font-semibold text-lg text-zinc-900">Upload Product</h3>
                        <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-8 flex flex-col items-center justify-center text-zinc-400 hover:border-orange-500/50 hover:bg-orange-50 transition-all cursor-pointer">
                            <Upload size={32} className="mb-2 text-zinc-300" />
                            <span className="text-sm font-medium">Drop image here</span>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-4xl space-y-4 bg-white/50">
                        <h3 className="font-semibold text-lg text-zinc-900">Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-wider">Style</label>
                                <select className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:border-orange-500 outline-none text-zinc-900 shadow-sm">
                                    <option>Studio Minimal</option>
                                    <option>Nature Outdoor</option>
                                    <option>Urban Street</option>
                                    <option>Luxury Interior</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-wider">Aspect Ratio</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1:1', '9:16', '16:9'].map((ratio) => (
                                        <button key={ratio} className="bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl py-3 text-xs font-bold text-zinc-600 transition-all shadow-sm">
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-3xl flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
                            disabled={isGenerating}
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                            {isGenerating ? 'Generating...' : 'Generate Images'}
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-8 rounded-4xl h-full min-h-[500px] flex flex-col bg-white/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg text-zinc-900">Results</h3>
                            <div className="flex gap-2">
                                <button className="p-3 hover:bg-white rounded-2xl transition-colors text-zinc-500 hover:text-orange-500"><Download size={20} /></button>
                            </div>
                        </div>

                        <div className="flex-1 bg-zinc-100 rounded-3xl flex items-center justify-center border border-zinc-200 relative overflow-hidden group">
                            {/* Placeholder Result */}
                            <div className="text-center">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm mx-auto mb-6 flex items-center justify-center">
                                    <Image size={32} className="text-zinc-300" />
                                </div>
                                <p className="text-zinc-400 font-medium">Generated images will appear here</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductGen;
