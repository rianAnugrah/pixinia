import React from 'react';
import {
    Users,
    Award,
    Target,
    Heart,
    Coffee,
    Code,
    Palette,
    Smartphone,
    ArrowRight,
    Calendar,
    MapPin,
    Mail
} from 'lucide-react';

export default function About() {
    const teamMembers = [
        {
            name: "Alex Johnson",
            role: "Full Stack Developer",
            avatar: "AJ",
            color: "from-blue-400 to-blue-600",
            skills: ["React", "Node.js", "Python"]
        },
        {
            name: "Sarah Chen",
            role: "UI/UX Designer",
            avatar: "SC",
            color: "from-purple-400 to-purple-600",
            skills: ["Figma", "Adobe XD", "Sketch"]
        },
        {
            name: "Mike Rodriguez",
            role: "Mobile Developer",
            avatar: "MR",
            color: "from-green-400 to-green-600",
            skills: ["React Native", "Flutter", "iOS"]
        },
        {
            name: "Lisa Wang",
            role: "Project Manager",
            avatar: "LW",
            color: "from-red-400 to-red-600",
            skills: ["Agile", "Scrum", "Leadership"]
        }
    ];

    const values = [
        {
            icon: Target,
            title: "Innovation First",
            description: "We embrace cutting-edge technologies and creative solutions to stay ahead of the curve.",
            color: "blue"
        },
        {
            icon: Users,
            title: "Client-Centric",
            description: "Your success is our success. We prioritize understanding and exceeding client expectations.",
            color: "purple"
        },
        {
            icon: Award,
            title: "Quality Excellence",
            description: "We deliver premium solutions with attention to detail and rigorous testing standards.",
            color: "green"
        },
        {
            icon: Heart,
            title: "Passion Driven",
            description: "We love what we do and it shows in every project we deliver with care and dedication.",
            color: "red"
        }
    ];

    const stats = [
        { number: "50+", label: "Projects Completed" },
        { number: "3+", label: "Years Experience" },
        { number: "25+", label: "Happy Clients" },
        { number: "100%", label: "Project Success Rate" }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: { bg: "from-blue-50 to-white", iconBg: "bg-blue-100", iconText: "text-blue-600" },
            purple: { bg: "from-purple-50 to-white", iconBg: "bg-purple-100", iconText: "text-purple-600" },
            green: { bg: "from-green-50 to-white", iconBg: "bg-green-100", iconText: "text-green-600" },
            red: { bg: "from-red-50 to-white", iconBg: "bg-red-100", iconText: "text-red-600" }
        };
        return colors[color];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">

            {/* Hero Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
              <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                👋 About Us
              </span>

                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                We Create Digital
                                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Experiences
                </span>
                            </h1>

                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Founded in 2022, Pixinia is a passionate team of developers, designers, and digital strategists
                                committed to transforming businesses through innovative web and mobile solutions.
                            </p>

                            <div className="flex items-center space-x-6 mb-8">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Calendar className="w-5 h-5" />
                                    <span>Est. 2022</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <MapPin className="w-5 h-5" />
                                    <span>Jakarta, Indonesia</span>
                                </div>
                            </div>

                            <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all hover:scale-105 flex items-center space-x-2 font-medium">
                                <span>Work With Us</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 aspect-square flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform">
                                        <Code className="w-8 h-8 text-blue-600 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Development</span>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform">
                                        <Palette className="w-8 h-8 text-purple-600 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Design</span>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform">
                                        <Smartphone className="w-8 h-8 text-green-600 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Mobile</span>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform">
                                        <Coffee className="w-8 h-8 text-red-600 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Coffee</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="px-6 py-16 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{stat.number}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Our Values
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            The principles that guide everything we do and shape the way we work with our clients.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {values.map((value, index) => {
                            const colorClasses = getColorClasses(value.color);
                            const IconComponent = value.icon;

                            return (
                                <div
                                    key={index}
                                    className={`bg-gradient-to-br ${colorClasses.bg} p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-all`}
                                >
                                    <div className={`w-16 h-16 ${colorClasses.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                                        <IconComponent className={`w-8 h-8 ${colorClasses.iconText}`} />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="px-6 py-16 md:py-24 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Meet Our Team
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            A diverse group of passionate professionals dedicated to delivering exceptional digital experiences.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all text-center">
                                <div className={`w-20 h-20 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                    <span className="text-white font-bold text-xl">{member.avatar}</span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                                <p className="text-gray-600 mb-4">{member.role}</p>

                                <div className="flex flex-wrap gap-2 justify-center">
                                    {member.skills.map((skill, skillIndex) => (
                                        <span
                                            key={skillIndex}
                                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
                                        >
                      {skill}
                    </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16 text-center text-white">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Our Mission
                        </h2>
                        <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                            To empower businesses and individuals by creating innovative, user-centric digital solutions
                            that drive growth, enhance user experiences, and make technology accessible to everyone.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                            <div className="text-center">
                                <div className="text-3xl mb-4">🎯</div>
                                <h3 className="text-xl font-bold mb-2">Vision</h3>
                                <p className="text-gray-300">To be the leading digital agency in Indonesia, known for innovation and excellence.</p>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl mb-4">🚀</div>
                                <h3 className="text-xl font-bold mb-2">Mission</h3>
                                <p className="text-gray-300">Transforming ideas into powerful digital experiences that drive business success.</p>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl mb-4">💎</div>
                                <h3 className="text-xl font-bold mb-2">Values</h3>
                                <p className="text-gray-300">Excellence, innovation, integrity, and client success in everything we do.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* History Timeline */}
            <section className="px-6 py-16 md:py-24 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Our Journey
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            From a small startup to a trusted digital partner for businesses across Indonesia.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200 hidden md:block"></div>

                        <div className="space-y-12">
                            <div className="flex flex-col md:flex-row items-center">
                                <div className="md:w-1/2 md:pr-8 mb-6 md:mb-0">
                                    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-gray-100">
                                        <div className="text-blue-600 font-bold text-sm mb-2">2022</div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Company Founded</h3>
                                        <p className="text-gray-600">Started as a small team with big dreams to revolutionize digital experiences.</p>
                                    </div>
                                </div>
                                <div className="hidden md:block w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg"></div>
                                <div className="md:w-1/2 md:pl-8"></div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center">
                                <div className="md:w-1/2 md:pr-8"></div>
                                <div className="hidden md:block w-4 h-4 bg-purple-500 rounded-full border-4 border-white shadow-lg"></div>
                                <div className="md:w-1/2 md:pl-8 mb-6 md:mb-0">
                                    <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-gray-100">
                                        <div className="text-purple-600 font-bold text-sm mb-2">2023</div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">First 20 Projects</h3>
                                        <p className="text-gray-600">Successfully delivered 20+ projects for local businesses and startups.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center">
                                <div className="md:w-1/2 md:pr-8 mb-6 md:mb-0">
                                    <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-gray-100">
                                        <div className="text-green-600 font-bold text-sm mb-2">2024</div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Team Expansion</h3>
                                        <p className="text-gray-600">Grew to a team of 8 professionals specializing in different technologies.</p>
                                    </div>
                                </div>
                                <div className="hidden md:block w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                                <div className="md:w-1/2 md:pl-8"></div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center">
                                <div className="md:w-1/2 md:pr-8"></div>
                                <div className="hidden md:block w-4 h-4 bg-red-500 rounded-full border-4 border-white shadow-lg"></div>
                                <div className="md:w-1/2 md:pl-8 mb-6 md:mb-0">
                                    <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-gray-100">
                                        <div className="text-red-600 font-bold text-sm mb-2">2025</div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Looking Forward</h3>
                                        <p className="text-gray-600">Expanding services and building partnerships to serve more clients nationwide.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-16 md:py-24 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 md:p-16 border border-gray-100">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            Want to Join Our Journey?
                        </h2>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                            We're always looking for talented individuals who share our passion for creating amazing digital experiences.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all hover:scale-105 font-medium flex items-center justify-center space-x-2">
                                <Mail className="w-5 h-5" />
                                <span>Send Us Your CV</span>
                            </button>
                            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-2xl hover:border-gray-400 transition-all hover:scale-105 font-medium">
                                Learn More About Careers
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