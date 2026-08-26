/**
 * VOLGA OS - Landing Page
 * 
 * Premium AI Operating System Landing Page
 */

import React, { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const features = [
    {
      title: 'Mission Center',
      description: 'Create, execute, and monitor complex AI missions with ease',
      icon: '🎯',
    },
    {
      title: 'Agent Network',
      description: 'Access 10+ specialized AI agents for any task',
      icon: '🤖',
    },
    {
      title: 'World Simulation',
      description: 'Predict outcomes before execution with advanced simulation',
      icon: '🔮',
    },
    {
      title: 'Collective Intelligence',
      description: 'Leverage multi-agent collaboration for superior results',
      icon: '🧠',
    },
    {
      title: 'Enterprise Ready',
      description: 'Organization management, RBAC, and audit trails',
      icon: '🏢',
    },
    {
      title: 'Self-Evolution',
      description: 'AI that learns and improves from every mission',
      icon: '⚡',
    },
  ];

  const stats = [
    { label: 'Active Agents', value: '10+' },
    { label: 'Missions Completed', value: '50K+' },
    { label: 'Success Rate', value: '94.5%' },
    { label: 'Uptime', value: '99.9%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                VOLGA OS
              </span>
              <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">v1.0</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <a href="#docs" className="text-gray-300 hover:text-white transition">Documentation</a>
              <a href="/auth/login" className="text-gray-300 hover:text-white transition">Sign In</a>
              <a href="/auth/signup" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center bg-purple-500/10 text-purple-300 px-4 py-2 rounded-full text-sm mb-8">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
            Now in Public Beta
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            The <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Premium AI</span>
            <br />Operating System
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            VOLGA OS unifies AI agents, simulations, and enterprise tools into a single powerful platform.
            Create missions, run simulations, and deploy solutions—all without reading documentation.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <a href="/auth/signup" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition shadow-lg shadow-purple-500/25">
              Start Free Trial
            </a>
            <a href="#demo" className="bg-gray-800 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-700 transition border border-gray-700">
              Watch Demo
            </a>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
              <div className="flex items-center px-4 py-3 bg-gray-900 border-b border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="mx-auto text-gray-400 text-sm">app.volga.ai</div>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-purple-400 text-2xl font-bold">24</div>
                    <div className="text-gray-400 text-sm">Active Missions</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-green-400 text-2xl font-bold">10</div>
                    <div className="text-gray-400 text-sm">Agents Online</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-pink-400 text-2xl font-bold">94%</div>
                    <div className="text-gray-400 text-sm">Success Rate</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-blue-400 text-2xl font-bold">2.1K</div>
                    <div className="text-gray-400 text-sm">Simulations</div>
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 h-48 flex items-center justify-center">
                  <span className="text-gray-500">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need for AI Operations
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A complete platform for creating, managing, and deploying AI-powered solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Center Showcase */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Create Missions in Minutes
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Describe what you want to accomplish. VOLGA creates the mission,
                selects the right agents, and executes automatically.
              </p>
              <ul className="space-y-4">
                {['Natural language mission creation', 'Intelligent agent selection', 'Real-time progress tracking', 'Automated results analysis'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <svg className="w-6 h-6 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <span className="text-purple-400 text-sm">Mission</span>
                <h4 className="text-white font-semibold">Build and Deploy Web App</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                  <span className="text-gray-400">Coding Agent</span>
                  <span className="text-green-400">Ready</span>
                </div>
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                  <span className="text-gray-400">Deployment Agent</span>
                  <span className="text-green-400">Ready</span>
                </div>
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                  <span className="text-gray-400">Simulation</span>
                  <span className="text-blue-400">Running...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <div className="text-4xl font-bold text-white mb-4">$0<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-gray-400 mb-6">Perfect for trying VOLGA</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  10 missions/month
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  5 agents
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Community support
                </li>
              </ul>
              <a href="/auth/signup" className="block text-center bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition">
                Get Started
              </a>
            </div>

            <div className="bg-gradient-to-b from-purple-900/50 to-gray-800 rounded-2xl border border-purple-500 p-8 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-sm px-4 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-white mb-4">$49<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-gray-400 mb-6">For professionals</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Unlimited missions
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  All 10 agents
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Priority support
                </li>
              </ul>
              <a href="/auth/signup" className="block text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
                Start Free Trial
              </a>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-white mb-4">Custom</div>
              <p className="text-gray-400 mb-6">For large organizations</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Everything in Pro
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Custom agents
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Dedicated support
                </li>
              </ul>
              <a href="/contact" className="block text-center bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-12 border border-purple-500/30">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your AI Operations?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of teams using VOLGA OS to build faster and smarter.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-gray-800 text-white px-6 py-4 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              {submitted ? '✓ Sent!' : 'Get Started'}
            </button>
          </form>
          <p className="text-gray-500 text-sm mt-4">
            Free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                VOLGA OS
              </div>
              <p className="text-gray-400 text-sm">
                The premium AI operating system for modern teams.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#docs" className="hover:text-white transition">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/about" className="hover:text-white transition">About</a></li>
                <li><a href="/blog" className="hover:text-white transition">Blog</a></li>
                <li><a href="/careers" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white transition">Terms</a></li>
                <li><a href="/security" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2026 VOLGA OS. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">GitHub</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
