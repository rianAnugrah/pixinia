import { ArrowRight, Star, Zap, Shield, Heart } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">

            {/* Hero Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="mb-8">
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              ✨ Now Available
            </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                        Beautiful Web
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Solutions
            </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Create stunning, responsive websites with our modern approach to web design.
                        Clean, fast, and built for the future.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all hover:scale-105 flex items-center space-x-2 font-medium">
                            <span>Start Your Project</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl hover:border-gray-300 transition-all hover:scale-105 font-medium">
                            View Portfolio
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">50+</div>
                            <div className="text-gray-600">Projects Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">100%</div>
                            <div className="text-gray-600">Client Satisfaction</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">24/7</div>
                            <div className="text-gray-600">Support Available</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="px-6 py-16 md:py-24 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Why Choose Pixinia?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We combine cutting-edge technology with beautiful design to deliver exceptional web experiences.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
                            <p className="text-gray-600">Optimized for speed with modern technologies and best practices.</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Reliable</h3>
                            <p className="text-gray-600">Built with security in mind, ensuring your data stays protected.</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                <Star className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Quality</h3>
                            <p className="text-gray-600">Attention to detail in every pixel, delivering excellence always.</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                                <Heart className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Made with Love</h3>
                            <p className="text-gray-600">Crafted with passion and dedication to exceed expectations.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Let's bring your vision to life with a beautiful, modern website that stands out from the crowd.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-white text-gray-900 px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 font-medium">
                                Start Your Project
                            </button>
                            <button className="border-2 border-gray-600 text-white px-8 py-4 rounded-2xl hover:border-gray-500 transition-all hover:scale-105 font-medium">
                                Contact Us
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-12 md:px-12 bg-white border-t border-gray-100">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-sm">P</span>
                            </div>
                            <span className="text-xl font-bold text-gray-800">Pixinia</span>
                            <span className="text-sm text-gray-500">.web.id</span>
                        </div>

                        <div className="text-gray-600 text-sm">
                            © 2025 Pixinia.web.id. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}