import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, ShoppingBag } from 'lucide-react';

const CAROUSEL_IMAGES = [
  '/images/rajesh-ram-HOOKgN_zIY8-unsplash.jpg',
  '/images/tim-mossholder-xDwEa2kaeJA-unsplash.jpg',
  '/images/warren-J33qmCVr02A-unsplash.jpg'
];

export default function Home({ user }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((currentIndex + 1) % CAROUSEL_IMAGES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((currentIndex - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  };

  const steps = [
    { title: 'Farmer enlists products', desc: 'Farmers list crops with set market and selling prices.' },
    { title: 'Market access provided', desc: 'Direct digital visibility for rural and regional farms.' },
    { title: 'Direct consumer purchase', desc: 'Customers order fresh crops directly online.' },
    { title: 'Farmers secure value', desc: 'Fair, direct return without agent commission deductions.' },
    { title: 'Premium fresh goods', desc: 'Customers receive top-tier, traceable farm produce.' }
  ];

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Dynamic Slide Carousel */}
      <div className="relative w-full max-w-5xl mx-auto mt-8 px-4 h-64 md:h-[400px] overflow-hidden rounded-2xl group shadow-lg">
        {CAROUSEL_IMAGES.map((imgSrc, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={imgSrc} className="w-full h-full object-cover" alt={`Farm view ${index + 1}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
        ))}

        {/* Carousel buttons */}
        <button 
          onClick={prevSlide}
          className="absolute top-1/2 left-4 z-30 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white font-bold p-3 rounded-full transition opacity-0 group-hover:opacity-100"
        >
          ❮
        </button>
        <button 
          onClick={nextSlide}
          className="absolute top-1/2 right-4 z-30 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white font-bold p-3 rounded-full transition opacity-0 group-hover:opacity-100"
        >
          ❯
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 flex gap-2">
          {CAROUSEL_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex ? 'bg-white px-2' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Description Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 mt-12">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-md border border-green-50">
          <h1 className="text-3xl md:text-5xl font-extrabold text-green-900 mb-6 tracking-tight">
            Welcome to AgriFusion
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            We are a dedicated agricultural marketplace connecting farmers directly with clients. 
            Our goal is to <span className="font-semibold text-green-700">eliminate middlemen commission</span>, optimize <span className="font-semibold text-green-700">fair profit shares</span>, and deliver fresh, sustainable crops straight to retail and commercial tables.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/products" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition shadow-md flex items-center gap-2">
              Browse Marketplace <ArrowRight className="w-5 h-5" />
            </Link>
            {!user && (
              <Link to="/register" className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold transition border border-gray-200">
                Join As Partner
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Key Selling Features */}
      <section className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-green-100 text-green-700 p-4 rounded-full mb-4">
            <Leaf className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-green-900 mb-2">100% Organic & Fresh</h3>
          <p className="text-gray-600 text-sm">Direct harvest distribution routes ensure maximum nutrient preservation and freshness.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-green-100 text-green-700 p-4 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-green-900 mb-2">Fair Value Standard</h3>
          <p className="text-gray-600 text-sm">Transparent pricing algorithms reflect true market values with absolute seller clarity.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-green-100 text-green-700 p-4 rounded-full mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-green-900 mb-2">Traceable Origins</h3>
          <p className="text-gray-600 text-sm">See exactly where your grains, fruits, and vegetables are grown using local GPS references.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 mt-20">
        <h2 className="text-3xl font-extrabold text-center text-green-900 mb-12">How AgriFusion Connects Farms</h2>
        <div className="relative flex flex-col md:flex-row items-start justify-between space-y-12 md:space-y-0 md:space-x-4 max-w-6xl mx-auto bg-white p-8 md:p-12 rounded-3xl border border-green-100 shadow-sm">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 flex flex-col items-center text-center px-2 relative">
              <div className="bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-lg mb-4 hover:scale-105 transition-all">
                {index + 1}
              </div>
              <h4 className="font-bold text-gray-800 text-base mb-1">{step.title}</h4>
              <p className="text-gray-500 text-xs leading-relaxed max-w-[180px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
