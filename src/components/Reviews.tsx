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
  // Sample reviews - you can replace these with real ones
  const reviews: Review[] = [
    {
      id: 1,
      name: "Sarah & James",
      rating: 5,
      review: "Absolutely magical experience! The Northern Lights tour exceeded all our expectations. Our guide was knowledgeable and made sure we got the perfect photos. Worth every penny!",
      location: "London, UK",
      date: "March 2024"
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      rating: 5,
      review: "The snowshoe rental was perfect for our family adventure. Equipment was top quality and the staff was incredibly helpful. Our kids loved every minute!",
      location: "Barcelona, Spain",
      date: "February 2024"
    },
    {
      id: 3,
      name: "David Chen",
      rating: 5,
      review: "Customized tour was exactly what we wanted. They tailored everything to our interests and made our Lapland dream come true. Highly recommend!",
      location: "Toronto, Canada",
      date: "January 2024"
    },
    {
      id: 4,
      name: "Emma & Tom",
      rating: 5,
      review: "Best tour company in Lapland! Professional, friendly, and the Northern Lights were absolutely spectacular. We'll definitely be back!",
      location: "Melbourne, Australia",
      date: "December 2023"
    },
    {
      id: 5,
      name: "Anna Schmidt",
      rating: 5,
      review: "Incredible experience from start to finish. The guides were amazing and the scenery was breathtaking. Perfect for our honeymoon!",
      location: "Berlin, Germany",
      date: "November 2023"
    },
    {
      id: 6,
      name: "Michael Johnson",
      rating: 5,
      review: "Outstanding service and unforgettable memories. The attention to detail and customer care was exceptional. Thank you Royal Nordic!",
      location: "New York, USA",
      date: "October 2023"
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
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
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
          <div className="flex animate-scroll">
            {/* First set of reviews */}
            {reviews.map((review) => (
              <div
                key={`first-${review.id}`}
                className="flex-shrink-0 w-80 sm:w-96 mx-4"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-full border border-white/20 hover:bg-white/15 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-4">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-6 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-sm sm:text-base">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs sm:text-sm">
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
            
            {/* Duplicate set for seamless loop */}
            {reviews.map((review) => (
              <div
                key={`second-${review.id}`}
                className="flex-shrink-0 w-80 sm:w-96 mx-4"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-full border border-white/20 hover:bg-white/15 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center mb-4">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-6 italic">
                    "{review.review}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-sm sm:text-base">
                          {review.name}
                        </h4>
                        {review.location && (
                          <p className="text-gray-400 text-xs sm:text-sm">
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
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default Reviews;
