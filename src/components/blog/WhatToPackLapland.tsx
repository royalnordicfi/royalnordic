import React from 'react';
import BlogPost from '../BlogPost';

const WhatToPackLapland: React.FC = () => {
  const post = {
    id: 2,
    title: "What to Pack for Lapland Winter Adventure",
    slug: "what-to-pack-lapland-winter-adventure",
    excerpt: "Essential packing list for your Lapland winter trip. From thermal layers to camera gear, ensure you're prepared for Arctic conditions.",
    content: `
      <p class="text-xl text-gray-300 mb-8 leading-relaxed">
        Packing for a Lapland winter adventure requires careful planning. With temperatures dropping to -30°C 
        and the possibility of spending hours outdoors chasing the Northern Lights, having the right gear is 
        essential for your comfort and safety.
      </p>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Essential Clothing Layers</h2>
      <p class="text-gray-300 mb-6 leading-relaxed">
        The key to staying warm in Lapland is <strong class="text-emerald-400">layering your clothing</strong>. 
        This allows you to adjust your temperature as conditions change throughout the day.
      </p>

      <h3 class="text-xl font-semibold text-white mb-3 mt-6">Base Layer (Thermal Underwear)</h3>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>Merino wool or synthetic thermal tops and bottoms</li>
        <li>Moisture-wicking materials to keep you dry</li>
        <li>Pack 2-3 sets for longer trips</li>
        <li>Avoid cotton as it retains moisture</li>
      </ul>

      <h3 class="text-xl font-semibold text-white mb-3 mt-6">Mid Layer (Insulation)</h3>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>Fleece jacket or down vest</li>
        <li>Wool sweaters or fleece pullovers</li>
        <li>Insulated pants or fleece-lined trousers</li>
        <li>Lightweight but warm materials</li>
      </ul>

      <h3 class="text-xl font-semibold text-white mb-3 mt-6">Outer Layer (Protection)</h3>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>Waterproof and windproof jacket</li>
        <li>Insulated winter coat (down or synthetic)</li>
        <li>Waterproof and windproof pants</li>
        <li>Breathable materials to prevent overheating</li>
      </ul>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Footwear</h2>
      <p class="text-gray-300 mb-6 leading-relaxed">
        Your feet are crucial for comfort during long Northern Lights tours and snowshoe adventures.
      </p>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>Insulated winter boots (rated to -30°C or lower)</li>
        <li>Waterproof and slip-resistant soles</li>
        <li>Wool or synthetic socks (bring extra pairs)</li>
        <li>Gaiters for deep snow conditions</li>
        <li>Ice cleats for slippery surfaces</li>
      </ul>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Accessories</h2>
      <p class="text-gray-300 mb-6 leading-relaxed">
        Don't forget these essential accessories that can make or break your Lapland experience.
      </p>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>Insulated gloves or mittens (bring backup pairs)</li>
        <li>Warm hat that covers your ears</li>
        <li>Neck gaiter or balaclava</li>
        <li>Polarized sunglasses (snow blindness protection)</li>
        <li>Hand and foot warmers (disposable or reusable)</li>
      </ul>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Photography Gear</h2>
      <p class="text-gray-300 mb-6 leading-relaxed">
        Capture the magic of Lapland with the right camera equipment.
      </p>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>DSLR or mirrorless camera with manual settings</li>
        <li>Wide-angle lens (14-24mm) for Northern Lights</li>
        <li>Sturdy tripod for long exposures</li>
        <li>Extra batteries (cold drains them quickly)</li>
        <li>Memory cards with high capacity</li>
        <li>Camera rain cover or plastic bag</li>
      </ul>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">Personal Items</h2>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>Moisturizer and lip balm (Arctic air is very dry)</li>
        <li>Prescription medications</li>
        <li>Travel insurance documents</li>
        <li>Power bank for your phone</li>
        <li>Universal adapter for electronics</li>
        <li>Small backpack for day trips</li>
      </ul>

      <div class="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-6 my-8">
        <h3 class="text-lg font-semibold text-emerald-400 mb-3">Pro Tip</h3>
        <p class="text-gray-300">
          If you forget any essential items, don't worry! Rovaniemi has excellent outdoor gear shops 
          where you can purchase or rent winter clothing and equipment. Our guides can also provide 
          recommendations for local shops.
        </p>
      </div>

      <h2 class="text-2xl font-bold text-white mb-4 mt-8">What NOT to Pack</h2>
      <p class="text-gray-300 mb-6 leading-relaxed">
        Avoid these common packing mistakes:
      </p>
      <ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">
        <li>Cotton clothing (retains moisture and makes you cold)</li>
        <li>Regular sneakers or fashion boots</li>
        <li>Heavy, bulky items you won't use</li>
        <li>Expensive jewelry (can get lost in the snow)</li>
        <li>Too many electronics (focus on the experience)</li>
      </ul>
    `,
    date: "2025-09-24",
    readTime: "4 min read",
    category: "Travel Tips",
    author: "Royal Nordic Team"
  };

  return <BlogPost post={post} />;
};

export default WhatToPackLapland;
