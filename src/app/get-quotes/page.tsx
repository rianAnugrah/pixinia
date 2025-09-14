"use client"
import React, { useState, useEffect } from 'react';
import {
    ArrowRight,
    ArrowLeft,
    Check,
    Star,
    Calculator,
    Clock,
    Shield,
    Zap,
    Code,
    Smartphone,
    ShoppingCart,
    Palette,
    Search,
    Settings,
    ChevronDown,
    Plus,
    Minus,
    Send,
    CheckCircle
} from 'lucide-react';

export default function GetQuote() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Service Selection
        services: [],
        primaryService: '',

        // Step 2: Project Details
        projectType: '',
        complexity: '',
        features: [],
        platforms: [],
        integrations: [],

        // Step 3: Requirements
        timeline: '',
        budget: '',
        teamSize: '',
        maintenance: false,
        hosting: false,

        // Step 4: Contact Info
        name: '',
        email: '',
        phone: '',
        company: '',
        website: '',
        description: ''
    });

    const [estimatedPrice, setEstimatedPrice] = useState({ min: 0, max: 0 });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const services = [
        {
            id: 'web-dev',
            name: 'Web Development',
            icon: Code,
            description: 'Custom websites and web applications',
            basePrice: 2000,
            color: 'blue'
        },
        {
            id: 'mobile-app',
            name: 'Mobile App',
            icon: Smartphone,
            description: 'iOS and Android applications',
            basePrice: 5000,
            color: 'purple'
        },
        {
            id: 'ecommerce',
            name: 'E-Commerce',
            icon: ShoppingCart,
            description: 'Online stores and marketplaces',
            basePrice: 3500,
            color: 'green'
        },
        {
            id: 'ui-ux',
            name: 'UI/UX Design',
            icon: Palette,
            description: 'User interface and experience design',
            basePrice: 1500,
            color: 'red'
        },
        {
            id: 'seo',
            name: 'SEO Optimization',
            icon: Search,
            description: 'Search engine optimization',
            basePrice: 800,
            color: 'yellow'
        },
        {
            id: 'maintenance',
            name: 'Maintenance & Support',
            icon: Settings,
            description: 'Ongoing support and updates',
            basePrice: 500,
            color: 'indigo'
        }
    ];

    const complexityLevels = [
        { id: 'basic', name: 'Basic', multiplier: 1, description: 'Simple design, basic functionality' },
        { id: 'intermediate', name: 'Intermediate', multiplier: 1.5, description: 'Custom features, integrations' },
        { id: 'advanced', name: 'Advanced', multiplier: 2.2, description: 'Complex systems, custom development' },
        { id: 'enterprise', name: 'Enterprise', multiplier: 3, description: 'Large scale, high performance' }
    ];

    const features = [
        { id: 'responsive', name: 'Responsive Design', price: 0 },
        { id: 'cms', name: 'Content Management System', price: 800 },
        { id: 'payment', name: 'Payment Gateway', price: 1200 },
        { id: 'analytics', name: 'Analytics Dashboard', price: 600 },
        { id: 'multilingual', name: 'Multi-language Support', price: 1000 },
        { id: 'api', name: 'API Integration', price: 1500 },
        { id: 'auth', name: 'User Authentication', price: 800 },
        { id: 'chat', name: 'Live Chat', price: 400 },
        { id: 'booking', name: 'Booking System', price: 1200 },
        { id: 'inventory', name: 'Inventory Management', price: 1500 }
    ];

    // Calculate estimated price
    useEffect(() => {
        let basePrice = 0;
        let complexityMultiplier = 1;
        let featuresPrice = 0;

        // Calculate base price from selected services
        formData.services.forEach(serviceId => {
            const service = services.find(s => s.id === serviceId);
            if (service) basePrice += service.basePrice;
        });

        // Apply complexity multiplier
        const complexity = complexityLevels.find(c => c.id === formData.complexity);
        if (complexity) complexityMultiplier = complexity.multiplier;

        // Add features price
        formData.features.forEach(featureId => {
            const feature = features.find(f => f.id === featureId);
            if (feature) featuresPrice += feature.price;
        });

        // Calculate maintenance and hosting
        let additionalServices = 0;
        if (formData.maintenance) additionalServices += 200;
        if (formData.hosting) additionalServices += 100;

        const totalBase = (basePrice * complexityMultiplier) + featuresPrice + additionalServices;

        setEstimatedPrice({
            min: Math.round(totalBase * 0.8),
            max: Math.round(totalBase * 1.3)
        });
    }, [formData]);

    const handleServiceToggle = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.includes(serviceId)
                ? prev.services.filter(id => id !== serviceId)
                : [...prev.services, serviceId],
            primaryService: prev.services.includes(serviceId) ? prev.primaryService : serviceId
        }));
    };

    const handleFeatureToggle = (featureId) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(featureId)
                ? prev.features.filter(id => id !== featureId)
                : [...prev.features, featureId]
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
    };

    const getColorClasses = (color) => {
        const colors = {
            blue: { bg: "from-blue-50 to-white", border: "border-blue-200", text: "text-blue-600", button: "bg-blue-600" },
            purple: { bg: "from-purple-50 to-white", border: "border-purple-200", text: "text-purple-600", button: "bg-purple-600" },
            green: { bg: "from-green-50 to-white", border: "border-green-200", text: "text-green-600", button: "bg-green-600" },
            red: { bg: "from-red-50 to-white", border: "border-red-200", text: "text-red-600", button: "bg-red-600" },
            yellow: { bg: "from-yellow-50 to-white", border: "border-yellow-200", text: "text-yellow-600", button: "bg-yellow-600" },
            indigo: { bg: "from-indigo-50 to-white", border: "border-indigo-200", text: "text-indigo-600", button: "bg-indigo-600" }
        };
        return colors[color] || colors.blue;
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Quote Request Sent!</h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Thank you for your interest in Pixinia! We've received your project details and will send you a detailed quote within 24 hours.
                        </p>

                        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Estimated Price Range</h3>
                            <div className="text-3xl font-bold text-blue-600">
                                ${estimatedPrice.min.toLocaleString()} - ${estimatedPrice.max.toLocaleString()}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">*Final quote may vary based on detailed requirements</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-gray-900 text-white px-8 py-3 rounded-2xl hover:bg-gray-800 transition-all font-medium"
                            >
                                Request Another Quote
                            </button>
                            <a
                                href="/contact"
                                className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-2xl hover:border-gray-400 transition-all font-medium"
                            >
                                Contact Us Directly
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">

            {/* Header */}
            <section className="px-6 py-12 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            💰 Get Your Quote
          </span>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                        Project Quote Calculator
                    </h1>

                    <p className="text-lg text-gray-600 mb-8">
                        Get an instant estimate for your project in just 4 simple steps.
                    </p>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-center mb-12">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    step <= currentStep
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {step < currentStep ? <Check className="w-5 h-5" /> : step}
                                </div>
                                {step < 4 && (
                                    <div className={`w-16 h-1 mx-2 ${
                                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Form Steps */}
            <section className="px-6 pb-16 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

                        {/* Step 1: Service Selection */}
                        {currentStep === 1 && (
                            <div className="p-8 md:p-12">
                                <div className="mb-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        What services do you need?
                                    </h2>
                                    <p className="text-gray-600">Select all the services that apply to your project.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map((service) => {
                                        const isSelected = formData.services.includes(service.id);
                                        const IconComponent = service.icon;
                                        const colorClasses = getColorClasses(service.color);

                                        return (
                                            <div
                                                key={service.id}
                                                onClick={() => handleServiceToggle(service.id)}
                                                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                                                    isSelected
                                                        ? `${colorClasses.bg} ${colorClasses.border}`
                                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <IconComponent className={`w-8 h-8 ${isSelected ? colorClasses.text : 'text-gray-400'}`} />
                                                    {isSelected && <Check className="w-6 h-6 text-green-500" />}
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
                                                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    From ${service.basePrice.toLocaleString()}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {formData.services.length > 0 && (
                                    <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Selected Services:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.services.map(serviceId => {
                                                const service = services.find(s => s.id === serviceId);
                                                return (
                                                    <span key={serviceId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {service?.name}
                          </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Project Details */}
                        {currentStep === 2 && (
                            <div className="p-8 md:p-12">
                                <div className="mb-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        Project Details
                                    </h2>
                                    <p className="text-gray-600">Tell us more about your project requirements.</p>
                                </div>

                                <div className="space-y-8">
                                    {/* Project Complexity */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Project Complexity</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {complexityLevels.map((level) => (
                                                <div
                                                    key={level.id}
                                                    onClick={() => handleInputChange('complexity', level.id)}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        formData.complexity === level.id
                                                            ? 'bg-blue-50 border-blue-200'
                                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900">{level.name}</h4>
                                                        <span className="text-sm text-gray-500">+{Math.round((level.multiplier - 1) * 100)}%</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{level.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Additional Features */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Features</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {features.map((feature) => {
                                                const isSelected = formData.features.includes(feature.id);
                                                return (
                                                    <div
                                                        key={feature.id}
                                                        onClick={() => handleFeatureToggle(feature.id)}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                            isSelected
                                                                ? 'bg-green-50 border-green-200'
                                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{feature.name}</h4>
                                                                <p className="text-sm text-gray-500">
                                                                    {feature.price === 0 ? 'Included' : `+$${feature.price}`}
                                                                </p>
                                                            </div>
                                                            {isSelected ? (
                                                                <Check className="w-5 h-5 text-green-500" />
                                                            ) : (
                                                                <Plus className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Requirements */}
                        {currentStep === 3 && (
                            <div className="p-8 md:p-12">
                                <div className="mb-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        Project Requirements
                                    </h2>
                                    <p className="text-gray-600">Help us understand your timeline and budget.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Timeline */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Project Timeline
                                            </label>
                                            <select
                                                value={formData.timeline}
                                                onChange={(e) => handleInputChange('timeline', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select timeline</option>
                                                <option value="asap">ASAP (Rush job +50%)</option>
                                                <option value="1-month">Within 1 month</option>
                                                <option value="2-3months">2-3 months</option>
                                                <option value="flexible">Flexible (3+ months)</option>
                                            </select>
                                        </div>

                                        {/* Budget */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Budget Range
                                            </label>
                                            <select
                                                value={formData.budget}
                                                onChange={(e) => handleInputChange('budget', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select budget range</option>
                                                <option value="under-5k">Under $5,000</option>
                                                <option value="5k-15k">$5,000 - $15,000</option>
                                                <option value="15k-50k">$15,000 - $50,000</option>
                                                <option value="over-50k">Over $50,000</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Additional Services */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Services</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Ongoing Maintenance</h4>
                                                    <p className="text-sm text-gray-600">Monthly updates and support</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.maintenance}
                                                        onChange={(e) => handleInputChange('maintenance', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Hosting Setup</h4>
                                                    <p className="text-sm text-gray-600">Domain and hosting configuration</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.hosting}
                                                        onChange={(e) => handleInputChange('hosting', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Contact Information */}
                        {currentStep === 4 && (
                            <div className="p-8 md:p-12">
                                <div className="mb-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        Contact Information
                                    </h2>
                                    <p className="text-gray-600">Almost done! We need your details to send the quote.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Your full name"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="your@email.com"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="+62 812-3456-7890"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.company}
                                                onChange={(e) => handleInputChange('company', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Your company"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Website (if any)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Project Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Tell us more about your project goals, target audience, and any specific requirements..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation & Price Estimate */}
                        <div className="border-t border-gray-100 p-6 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {currentStep > 1 && (
                                        <button
                                            onClick={prevStep}
                                            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl hover:border-gray-400 transition-all font-medium"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Previous</span>
                                        </button>
                                    )}
                                </div>

                                {/* Price Estimate */}
                                <div className="text-center flex-1 mx-8">
                                    {estimatedPrice.min > 0 && (
                                        <div className="bg-white rounded-2xl p-4 border border-gray-200">
                                            <div className="text-sm text-gray-600 mb-1">Estimated Price Range</div>
                                            <div className="text-xl font-bold text-blue-600">
                                                ${estimatedPrice.min.toLocaleString()} - ${estimatedPrice.max.toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-4">
                                    {currentStep < 4 ? (
                                        <button
                                            onClick={nextStep}
                                            disabled={
                                                (currentStep === 1 && formData.services.length === 0) ||
                                                (currentStep === 2 && !formData.complexity)
                                            }
                                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span>Next Step</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!formData.name || !formData.email}
                                            className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>Get My Quote</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 py-16 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Our Quote Calculator?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Get accurate estimates instantly with our intelligent pricing system.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Calculator className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Instant Estimates</h3>
                            <p className="text-gray-600 text-sm">Get real-time pricing as you select your requirements</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Save Time</h3>
                            <p className="text-gray-600 text-sm">No more back-and-forth emails for basic pricing</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Transparent Pricing</h3>
                            <p className="text-gray-600 text-sm">Clear breakdown of costs with no hidden fees</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Response</h3>
                            <p className="text-gray-600 text-sm">Detailed quote delivered within 24 hours</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="px-6 py-16 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            What Our Clients Say
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "The quote calculator gave us a clear idea of costs upfront. No surprises, professional service!"
                            </p>
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">RK</span>
                                </div>
                                <div className="ml-3">
                                    <div className="font-semibold text-gray-900 text-sm">Rini Kusuma</div>
                                    <div className="text-xs text-gray-600">Startup Founder</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "Fast, accurate, and transparent pricing. Made our decision process much easier."
                            </p>
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">DS</span>
                                </div>
                                <div className="ml-3">
                                    <div className="font-semibold text-gray-900 text-sm">Dedi Santoso</div>
                                    <div className="text-xs text-gray-600">E-commerce Owner</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "Love how detailed the quote was. They really understood our requirements perfectly."
                            </p>
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">ML</span>
                                </div>
                                <div className="ml-3">
                                    <div className="font-semibold text-gray-900 text-sm">Maya Lestari</div>
                                    <div className="text-xs text-gray-600">Marketing Director</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="px-6 py-16 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Quote Calculator FAQ
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-6 rounded-2xl">
                            <h3 className="font-bold text-gray-900 mb-2">How accurate are the estimates?</h3>
                            <p className="text-gray-600 text-sm">Our estimates are based on industry standards and our experience. The final quote may vary ±20% depending on specific requirements and complexity discovered during detailed analysis.</p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl">
                            <h3 className="font-bold text-gray-900 mb-2">Do you charge for detailed quotes?</h3>
                            <p className="text-gray-600 text-sm">No! Our detailed quotes are completely free. We only charge when you decide to proceed with the project and sign our agreement.</p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl">
                            <h3 className="font-bold text-gray-900 mb-2">Can I modify my requirements later?</h3>
                            <p className="text-gray-600 text-sm">Yes, you can modify requirements before the project starts. Changes during development may affect timeline and cost, which we'll discuss transparently.</p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl">
                            <h3 className="font-bold text-gray-900 mb-2">What happens after I submit the form?</h3>
                            <p className="text-gray-600 text-sm">Within 24 hours, you'll receive a detailed quote via email. We'll also schedule a consultation call to discuss your project in more detail if needed.</p>
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