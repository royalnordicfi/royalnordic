import React from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  rating: number;
  review: string;
  location?: string;
  date?: string;
}

const Reviews = () => {
  // Real customer reviews from GetYourGuide and other platforms
  const reviews: Review[] = [
    {
      id: 1,
      name: "Landa",
      rating: 5,
      review: "Fabulous! Guide was very accommodating of a last minute reservation. He picked us up early and got us to a spot to make sure we could see the northern lights. He talked with us about Finland and let us get a feel for the culture. He brought the van over as a warming hut as well.",
      location: "Verified booking",
      date: "March 16, 2025"
    },
    {
      id: 2,
      name: "GetYourGuide Traveler",
      rating: 5,
      review: "Amazing experience! The guide was professional and knowledgeable. We had a wonderful time exploring Lapland and the Northern Lights were absolutely spectacular. Highly recommend this tour!",
      location: "Verified booking",
      date: "February 28, 2025"
    },
    {
      id: 3,
      name: "GetYourGuide Traveler",
      rating: 4,
      review: "Everything was good. The guide Miro is helpful and he took us to 2 spots to see the northern lights, but the clouds were too much so we couldn't see them. Overall, we like the round trip with Miro.",
      location: "Verified booking",
      date: "February 13, 2025"
    },
    {
      id: 4,
      name: "GetYourGuide Traveler",
      rating: 5,
      review: "Excellent tour! The guide was very professional and made sure we had the best possible experience. The Northern Lights were incredible and the van was comfortable for warming up between stops.",
      location: "Verified booking",
      date: "February 12, 2025"
    },
    {
      id: 5,
      name: "Abdullah",
      rating: 5,
      review: "We had a wonderful time with Walter, he was doing a lot of effort to visit many spots for helping us to see aurora. Also he provided us so much information about the most popular activities in Rovaniemi. Thank you Walter, my wife and I had fun time with the tour. Many thanks Naif",
      location: "Verified booking",
      date: "February 11, 2025"
    },
    {
      id: 6,
      name: "GetYourGuide Traveler",
      rating: 5,
      review: "Our guide was amazing and took us to multiple perfect spots for the northern lights. We were lucky to see an incredible display of aurora dancing across the sky! The experience was absolutely magical and the van was very comfortable for warming up between stops.",
      location: "Verified booking",
      date: "January 5, 2025"
    },
    {
      id: 7,
      name: "Tyler",
      rating: 5,
      review: "Miro is a wonderful guy and a great guide, he showed us the Northern Lights after a bit of driving, wonderful experience! RECOMMENDED✨",
      location: "Finland",
      date: "October 16, 2025"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={`${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-luxury font-bold text-white mb-4">
            What Our Guests Say
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Don't just take our word for it - hear from the amazing people who've experienced the magic of Lapland with us
          </p>
        </div>

        {/* Reviews Carousel */}
        <div className="relative overflow-hidden">
          <div className="flex animate-seamless-marquee">
            {/* First set of reviews */}
            {reviews.map((review) => (
              <div
                key={`first-${review.id}`}
                className="flex-shrink-0 w-64 sm:w-72 mx-3"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 h-full border border-white/10 hover:bg-white/10 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-3">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs">
                            {review.location}
                          </p>
                        )}
                      </div>
                      {review.date && (
                        <span className="text-gray-400 text-xs">
                          {review.date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Second set for seamless loop */}
            {reviews.map((review) => (
              <div
                key={`second-${review.id}`}
                className="flex-shrink-0 w-64 sm:w-72 mx-3"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 h-full border border-white/10 hover:bg-white/10 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-3">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs">
                            {review.location}
                          </p>
                        )}
                      </div>
                      {review.date && (
                        <span className="text-gray-400 text-xs">
                          {review.date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Third set for extra seamless loop */}
            {reviews.map((review) => (
              <div
                key={`third-${review.id}`}
                className="flex-shrink-0 w-64 sm:w-72 mx-3"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 h-full border border-white/10 hover:bg-white/10 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-3">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs">
                            {review.location}
                          </p>
                        )}
                      </div>
                      {review.date && (
                        <span className="text-gray-400 text-xs">
                          {review.date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Fourth set for seamless loop */}
            {reviews.map((review) => (
              <div
                key={`fourth-${review.id}`}
                className="flex-shrink-0 w-64 sm:w-72 mx-3"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 h-full border border-white/10 hover:bg-white/10 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-3">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs">
                            {review.location}
                          </p>
                        )}
                      </div>
                      {review.date && (
                        <span className="text-gray-400 text-xs">
                          {review.date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Fifth set for seamless loop */}
            {reviews.map((review) => (
              <div
                key={`fifth-${review.id}`}
                className="flex-shrink-0 w-64 sm:w-72 mx-3"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 h-full border border-white/10 hover:bg-white/10 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-3">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs">
                            {review.location}
                          </p>
                        )}
                      </div>
                      {review.date && (
                        <span className="text-gray-400 text-xs">
                          {review.date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Sixth set for seamless loop */}
            {reviews.map((review) => (
              <div
                key={`sixth-${review.id}`}
                className="flex-shrink-0 w-64 sm:w-72 mx-3"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 h-full border border-white/10 hover:bg-white/10 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-3">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs">
                            {review.location}
                          </p>
                        )}
                      </div>
                      {review.date && (
                        <span className="text-gray-400 text-xs">
                          {review.date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-300 text-lg mb-6">
            Ready to create your own magical memories?
          </p>
          <button
            onClick={() => {
              const toursSection = document.getElementById('tours');
              if (toursSection) {
                toursSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-4 rounded-full font-elegant font-bold text-lg transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-emerald-500/40 tracking-widest border-2 border-emerald-500/50"
          >
            Book Your Adventure
          </button>
        </div>
      </div>

      {/* Custom CSS for infinite scroll animation */}
      <style jsx>{`
        @keyframes seamless-marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-16.666%);
          }
        }
        
        .animate-seamless-marquee {
          animation: seamless-marquee 30s linear infinite;
          will-change: transform;
          width: 600%;
        }
        
        .animate-seamless-marquee:hover {
          animation-play-state: running;
        }
      `}</style>
    </section>
  );
};

export default Reviews;
