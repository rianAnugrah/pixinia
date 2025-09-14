import {
    Code,
    Smartphone,
    ShoppingCart,
    Palette,
    Search,
    Zap,
    ArrowRight,
    Check,
    Star
} from 'lucide-react';

export default function Services() {
    const services = [
        {
            icon: Code,
            title: "Web Development",
            description: "Custom websites built with modern technologies like React, Next.js, and Node.js.",
            features: ["Responsive Design", "SEO Optimized", "Fast Loading", "Secure Code"],
            price: "Starting from $2,000",
            color: "blue"
        },
        {
            icon: Smartphone,
            title: "Mobile App Development",
            description: "Native and cross-platform mobile applications for iOS and Android.",
            features: ["React Native", "Flutter", "Native iOS/Android", "App Store Deployment"],
            price: "Starting from $5,000",
            color: "purple"
        },
        {
            icon: ShoppingCart,
            title: "E-Commerce Solutions",
            description: "Complete online stores with payment integration and inventory management.",
            features: ["Payment Gateway", "Inventory System", "Admin Dashboard", "Analytics"],
            price: "Starting from $3,500",
            color: "green"
        },
        {
            icon: Palette,
            title: "UI/UX Design",
            description: "Beautiful and intuitive user interfaces that convert visitors to customers.",
            features: ["User Research", "Wireframing", "Prototyping", "Design System"],
            price: "Starting from $1,500",
            color: "red"
        },
        {
            icon: Search,
            title: "SEO Optimization",
            description: "Improve your search engine rankings and drive organic traffic.",
            features: ["Keyword Research", "On-Page SEO", "Technical SEO", "Performance Audit"],
            price: "Starting from $800",
            color: "yellow"
        },
        {
            icon: Zap,
            title: "Performance Optimization",
            description: "Speed up your website and improve user experience significantly.",
            features: ["Speed Optimization", "Core Web Vitals", "CDN Setup", "Image Optimization"],
            price: "Starting from $1,200",
            color: "indigo"
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: {
                bg: "from-blue-50 to-white",
                iconBg: "bg-blue-100",
                iconText: "text-blue-600",
                button: "bg-blue-600 hover:bg-blue-700"
            },
            purple: {
                bg: "from-purple-50 to-white",
                iconBg: "bg-purple-100",
                iconText: "text-purple-600",
                button: "bg-purple-600 hover:bg-purple-700"
            },
            green: {
                bg: "from-green-50 to-white",
                iconBg: "bg-green-100",
                iconText: "text-green-600",
                button: "bg-green-600 hover:bg-green-700"
            },
            red: {
                bg: "from-red-50 to-white",
                iconBg: "bg-red-100",
                iconText: "text-red-600",
                button: "bg-red-600 hover:bg-red-700"
            },
            yellow: {
                bg: "from-yellow-50 to-white",
                iconBg: "bg-yellow-100",
                iconText: "text-yellow-600",
                button: "bg-yellow-600 hover:bg-yellow-700"
            },
            indigo: {
                bg: "from-indigo-50 to-white",
                iconBg: "bg-indigo-100",
                iconText: "text-indigo-600",
                button: "bg-indigo-600 hover:bg-indigo-700"
            }
        };
        return colors[color];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">

            {/* Hero Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            🚀 Our Services
          </span>

                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Digital Solutions
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              That Drive Results
            </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                        From web development to mobile apps, we offer comprehensive digital services
                        to help your business thrive in the digital world.
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="px-6 py-16 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => {
                            const colorClasses = getColorClasses(service.color);
                            const IconComponent = service.icon;

                            return (
                                <div
                                    key={index}
                                    className={`bg-gradient-to-br ${colorClasses.bg} p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105`}
                                >
                                    <div className={`w-16 h-16 ${colorClasses.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                                        <IconComponent className={`w-8 h-8 ${colorClasses.iconText}`} />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                                    <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Features Include:</h4>
                                        <ul className="space-y-2">
                                            {service.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-center space-x-2">
                                                    <Check className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm text-gray-600">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-2xl font-bold text-gray-900">{service.price}</span>
                                    </div>

                                    <button className={`w-full ${colorClasses.button} text-white px-6 py-3 rounded-2xl transition-all flex items-center justify-center space-x-2 font-medium`}>
                                        <span>Learn More</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="px-6 py-16 md:py-24 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Our Process
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We follow a proven methodology to deliver exceptional results for every project.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-blue-600">1</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Discovery</h3>
                            <p className="text-gray-600">Understanding your goals, requirements, and target audience.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-purple-600">2</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Planning</h3>
                            <p className="text-gray-600">Creating detailed project roadmap and technical specifications.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-green-600">3</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Development</h3>
                            <p className="text-gray-600">Building your solution with regular updates and feedback loops.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-red-600">4</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Launch</h3>
                            <p className="text-gray-600">Deploying your project and providing ongoing support.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Client Success Stories
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-6 italic">
                                "Pixinia delivered an exceptional e-commerce platform that increased our online sales by 300%. Highly recommended!"
                            </p>
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">AS</span>
                                </div>
                                <div className="ml-4">
                                    <div className="font-semibold text-gray-900">Ahmad Sulaiman</div>
                                    <div className="text-sm text-gray-600">CEO, TokoBaju.id</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-6 italic">
                                "The mobile app they built for us is fantastic. User-friendly interface and great performance!"
                            </p>
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">SR</span>
                                </div>
                                <div className="ml-4">
                                    <div className="font-semibold text-gray-900">Sari Rahayu</div>
                                    <div className="text-sm text-gray-600">Founder, HealthApp</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-6 italic">
                                "Professional team, on-time delivery, and excellent support. Will definitely work with them again."
                            </p>
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">BP</span>
                                </div>
                                <div className="ml-4">
                                    <div className="font-semibold text-gray-900">Budi Pratama</div>
                                    <div className="text-sm text-gray-600">Director, StartupXYZ</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Ready to Start Your Project?
                        </h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Let's discuss your requirements and create something amazing together.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-white text-gray-900 px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 font-medium">
                                Get Free Quote
                            </button>
                            <button className="border-2 border-gray-600 text-white px-8 py-4 rounded-2xl hover:border-gray-500 transition-all hover:scale-105 font-medium">
                                Schedule Call
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