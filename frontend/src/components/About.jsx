import React from 'react';
import { ShieldAlert, Users, Compass, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="flex-grow bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mt-4 mb-6">
          About AgriFusion
        </h1>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-12">
          At AgriFusion, we are building a future where farmers are digitally empowered and consumers receive fresh, direct-from-origin produce. 
          Our core objective is to <span className="font-semibold text-green-700">eliminate middlemen commission</span>, secure <span className="font-semibold text-green-700">fair profit shares</span>, and deliver top-tier crops directly to homes and warehouses.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm flex gap-4">
            <div className="bg-green-100 text-green-700 p-3 rounded-xl h-fit">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-2">Empowering Farmers</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We provide independent growers a transparent digital storefront to catalog and market their harvest without paying high commissions to agents.
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm flex gap-4">
            <div className="bg-green-100 text-green-700 p-3 rounded-xl h-fit">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-2">Traceable Supply</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Customers buy directly from verified farms. Each listing is tied to a specific grower with location coordinates and chat options.
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm flex gap-4">
            <div className="bg-green-100 text-green-700 p-3 rounded-xl h-fit">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-2">Community First</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                By investing directly in rural creators, we foster trust, ethical pricing, and sustainable local economies in the agriculture system.
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm flex gap-4">
            <div className="bg-green-100 text-green-700 p-3 rounded-xl h-fit">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-2">Our Long-term Vision</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Leveraging digital web standards to facilitate zero-friction grain trade, logistics planning, and financial services for smallholders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
