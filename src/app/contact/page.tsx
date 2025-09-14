"use client"
import React, { useState } from 'react';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    MessageSquare,
    User,
    Building,
    Calendar,
    CheckCircle,
    Instagram,
    Twitter,
    Linkedin,
    ArrowRight
} from 'lucide-react';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        service: '',
        budget: '',
        message: '',
        timeline: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the data to your backend
        setIsSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({
                name: '',
                email: '',
                company: '',
                service: '',
                budget: '',
                message: '',
                timeline: ''
            });
        }, 3000);
    };

    const contactInfo = [
        {
            icon: Mail,
            title: "Email Us",
            content: "hello@pixinia.web.id",
            link: "mailto:hello@pixinia.web.id",
            color: "blue"
        },
        {
            icon: Phone,
            title: "Call Us",
            content: "+62 812-3456-7890",
            link: "tel:+6281234567890",
            color: "green"
        },
        {
            icon: MapPin,
            title: "Visit Us",
            content: "Jakarta, Indonesia",
            link: "https://maps.google.com",
            color: "red"
        },
        {
            icon: Clock,
            title: "Working Hours",
            content: "Mon-Fri: 9AM-6PM WIB",
            link: null,
            color: "purple"
        }
    ];

    const socialMedia = [
        { icon: Instagram, link: "#", color: "from-pink-500 to-purple-500" },
        { icon: Twitter, link: "#", color: "from-blue-400 to-blue-600" },
        { icon: Linkedin, link: "#", color: "from-blue-600 to-blue-800" }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: { bg: "from-blue-50 to-white", iconBg: "bg-blue-100", iconText: "text-blue-600" },
            green: { bg: "from-green-50 to-white", iconBg: "bg-green-100", iconText: "text-green-600" },
            red: { bg: "from-red-50 to-white", iconBg: "bg-red-100", iconText: "text-red-600" },
            purple: { bg: "from-purple-50 to-white", iconBg: "bg-purple-100", iconText: "text-purple-600" }
        };
        return colors[color];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">

            {/* Hero Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            📞 Get In Touch
          </span>

                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Let's Start Your
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Digital Journey
            </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Ready to transform your business with cutting-edge digital solutions?
                        We're here to help you every step of the way.
                    </p>
                </div>
            </section>

            {/* Contact Info */}
            <section className="px-6 py-16 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {contactInfo.map((info, index) => {
                            const colorClasses = getColorClasses(info.color);
                            const IconComponent = info.icon;

                            return (
                                <div
                                    key={index}
                                    className={`bg-gradient-to-br ${colorClasses.bg} p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all text-center`}
                                >
                                    <div className={`w-12 h-12 ${colorClasses.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                        <IconComponent className={`w-6 h-6 ${colorClasses.iconText}`} />
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                                    {info.link ? (
                                        <a href={info.link} className="text-gray-600 hover:text-gray-900 transition-colors">
                                            {info.content}
                                        </a>
                                    ) : (
                                        <p className="text-gray-600">{info.content}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Contact Form & Map Section */}
            <section className="px-6 py-16 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Contact Form */}
                        <div>
                            <div className="mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    Start Your Project
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Fill out the form below and we'll get back to you within 24 hours with a detailed proposal.
                                </p>
                            </div>

                            {isSubmitted ? (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent Successfully!</h3>
                                    <p className="text-green-600">
                                        Thank you for contacting us. We'll get back to you within 24 hours.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name *
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Your full name"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="your@email.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Your company name"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Service Needed *
                                            </label>
                                            <select
                                                name="service"
                                                value={formData.service}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select a service</option>
                                                <option value="web-development">Web Development</option>
                                                <option value="mobile-app">Mobile App Development</option>
                                                <option value="ecommerce">E-Commerce Solutions</option>
                                                <option value="ui-ux">UI/UX Design</option>
                                                <option value="seo">SEO Optimization</option>
                                                <option value="performance">Performance Optimization</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Budget Range
                                            </label>
                                            <select
                                                name="budget"
                                                value={formData.budget}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select budget range</option>
                                                <option value="under-5k">Under $5,000</option>
                                                <option value="5k-15k">$5,000 - $15,000</option>
                                                <option value="15k-50k">$15,000 - $50,000</option>
                                                <option value="over-50k">Over $50,000</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Project Timeline
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <select
                                                    name="timeline"
                                                    value={formData.timeline}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Select timeline</option>
                                                    <option value="asap">ASAP</option>
                                                    <option value="1-month">Within 1 month</option>
                                                    <option value="2-3months">2-3 months</option>
                                                    <option value="flexible">Flexible</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Project Details *
                                        </label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleInputChange}
                                                required
                                                rows="6"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                placeholder="Tell us about your project, goals, and any specific requirements..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all hover:scale-105 flex items-center justify-center space-x-2 font-medium"
                                    >
                                        <Send className="w-5 h-5" />
                                        <span>Send Message</span>
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Map & Additional Info */}
                        <div>
                            <div className="mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    Our Location
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Based in Jakarta, we serve clients across Indonesia and internationally.
                                    Schedule a meeting or visit our office for a coffee chat!
                                </p>
                            </div>

                            {/* Map Placeholder */}
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-12 text-center mb-8 aspect-square flex items-center justify-center">
                                <div>
                                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-600 mb-2">Interactive Map</h3>
                                    <p className="text-gray-500">Jakarta, Indonesia</p>
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
                                <p className="text-gray-600 mb-6">
                                    Stay updated with our latest projects and insights on social media.
                                </p>

                                <div className="flex space-x-4">
                                    {socialMedia.map((social, index) => {
                                        const IconComponent = social.icon;
                                        return (
                                            <a
                                                key={index}
                                                href={social.link}
                                                className={`w-12 h-12 bg-gradient-to-br ${social.color} rounded-2xl flex items-center justify-center text-white hover:scale-105 transition-transform`}
                                            >
                                                <IconComponent className="w-6 h-6" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-lg text-gray-600">
                            Got questions? We've got answers to help you get started.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">How long does a typical project take?</h3>
                            <p className="text-gray-600">Project timelines vary depending on complexity. A simple website takes 2-4 weeks, while complex web applications can take 2-6 months.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Do you provide ongoing support and maintenance?</h3>
                            <p className="text-gray-600">Yes! We offer comprehensive support packages including regular updates, security monitoring, performance optimization, and technical support.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">What's your development process like?</h3>
                            <p className="text-gray-600">We follow an agile methodology with regular client feedback. Our process includes discovery, planning, design, development, testing, and deployment phases.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Can you work with existing systems and platforms?</h3>
                            <p className="text-gray-600">Absolutely! We have experience integrating with various platforms, APIs, and existing systems. We can enhance or migrate your current setup.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Do you offer payment plans?</h3>
                            <p className="text-gray-600">Yes, we offer flexible payment plans. Typically 50% upfront and 50% upon completion, with milestone-based payments for larger projects.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-16 md:py-24 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Don't wait! The digital world moves fast, and your competition isn't standing still.
                            Let's build something amazing together.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-white text-gray-900 px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 font-medium flex items-center justify-center space-x-2">
                                <span>Schedule Free Consultation</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button className="border-2 border-gray-600 text-white px-8 py-4 rounded-2xl hover:border-gray-500 transition-all hover:scale-105 font-medium">
                                View Our Portfolio
                            </button>
                        </div>

                        <div className="mt-8 text-gray-400 text-sm">
                            🎯 Free consultation • 💰 No hidden fees • ⚡ Quick response time
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Contact Bar */}
            <section className="px-6 py-8 md:px-12 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-white">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-lg font-bold mb-1">Need immediate assistance?</h3>
                        <p className="text-blue-100">Call us directly or send a WhatsApp message</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <a
                            href="tel:+6281234567890"
                            className="bg-white text-blue-600 px-6 py-3 rounded-2xl hover:bg-blue-50 transition-all font-medium flex items-center space-x-2"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Call Now</span>
                        </a>
                        <a
                            href="https://wa.me/6281234567890"
                            className="bg-green-500 text-white px-6 py-3 rounded-2xl hover:bg-green-600 transition-all font-medium flex items-center space-x-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>WhatsApp</span>
                        </a>
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