import React from "react";

export default function Navbar() {

    return(

    <nav className="px-6 py-4 md:px-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold text-gray-800">Pixinia</span>
                <span className="text-sm text-gray-500">.web.id</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
                <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
                <a href="/services" className="text-gray-600 hover:text-gray-900 transition-colors">Services</a>
                <a href="/about" className="text-gray-900 font-medium">About</a>
                <a href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
            </div>

            <a href="/get-quotes" className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">Get Started</a>


        </div>
    </nav>

)
}