import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users, MapPin, CheckCircle, XCircle } from 'lucide-react';
import ImageSlideshow from './ImageSlideshow';
import Footer from './Footer';
import BookingForm from './BookingForm';
import ProductFaq from './seo/ProductFaq';
import RelatedTours from './seo/RelatedTours';

const FamilyFriendlyNorthernLights: React.FC = () => {
  const tourImages = [
    '/family1.jpg',
    '/family2.jpg',
    '/family3.jpg',
    '/family4.jpg',
  ];

  const knowBefore: Array<string | { text: string; link?: { to: string; label: string } }> = [
    {
      text: 'Northern Lights are a natural phenomenon and cannot be guaranteed on this tour. For a guaranteed product, see our ',
      link: { to: '/northern-lights-tour', label: 'Guaranteed Northern Lights Tour' },
    },
    'Designed for all ages — a shorter, comfortable evening for families.',
    'Dress warmly; we have a warm vehicle, but viewing stops are outdoors.',
    'Free cancellation up to 24 hours before departure.',
  ];

  const faqs = [
    {
      question: 'Are the Northern Lights guaranteed on this tour?',
      answer:
        'No. This is a shorter family-friendly evening and aurora sightings are never 100% guaranteed. If you want our guaranteed product, book the Guaranteed Northern Lights Tour.',
    },
    {
      question: 'What time does the tour start?',
      answer:
        'Hotel pickup is typically around 21:00 in the Rovaniemi area. Exact pickup time is confirmed after booking.',
    },
    {
      question: 'Is it suitable for children?',
      answer:
        'Yes — the format is designed for families and all ages. Child pricing applies for ages 0–14. Bring warm outdoor layers for viewing stops.',
    },
    {
      question: 'How long is the tour?',
      answer: 'About 2 hours including pickup, viewing stops with hot drinks, and return to Rovaniemi.',
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        <ImageSlideshow
          images={tourImages}
          className="h-[35rem] sm:h-[40rem] md:h-[45rem] lg:h-[50rem]"
          alt="Family-Friendly Northern Lights Tour"
        />

        <div className="absolute inset-0 flex items-center justify-center z-10 pt-32 sm:pt-36 md:pt-32 lg:pt-28 xl:pt-24">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link
              to="/northern-lights-tours"
              className="inline-flex items-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 font-medium px-4 py-2 rounded-lg mb-8 sm:mb-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Northern Lights Tours
            </Link>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Family-Friendly Northern Lights Tour
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white font-clean max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl px-2">
              A shorter 2-hour aurora evening from Rovaniemi — hotel pickup, warm drinks, and a guide for the whole family.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Duration</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">2 hours</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Group Size</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Max 16 people</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Location</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Rovaniemi, Lapland</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center mb-2 sm:mb-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Languages</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">English &amp; Finnish</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Tour</h2>
              <p className="text-gray-300 text-sm sm:text-base font-clean mb-3">
                Begin with hotel pickup in Rovaniemi, then head away from city lights to viewing spots chosen for the evening’s weather and aurora activity.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Your guide shares stories about the Northern Lights and Lapland while you stay warm with hot drinks and snacks. A shorter, comfortable format designed for families and all ages — aurora sightings are never 100% guaranteed.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What&apos;s Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  'Hotel pickup and drop-off',
                  'Professional local guide (English & Finnish)',
                  'Hot drinks and snacks',
                  'Aurora photography tips',
                  'Warm vehicle for the journey',
                ].map((item) => (
                  <div key={item} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What&apos;s Not Included</h2>
              <div className="space-y-2">
                <div className="flex items-start">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm sm:text-base">Warm winter clothing (bring layered outdoor clothing)</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Know Before You Go</h2>
              <ul className="space-y-2">
                {knowBefore.map((item, index) => (
                  <li key={index} className="flex items-start text-gray-300 text-sm sm:text-base font-clean">
                    <span className="text-emerald-400 mr-2 mt-0.5">•</span>
                    <span>
                      {typeof item === 'string' ? (
                        item
                      ) : (
                        <>
                          {item.text}
                          {item.link && (
                            <Link to={item.link.to} className="text-emerald-400 underline underline-offset-2">
                              {item.link.label}
                            </Link>
                          )}
                          .
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Tour Itinerary</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm sm:text-base mb-1">~21:00 — Pickup</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">
                      Hotel pickup in the Rovaniemi area. Exact time is confirmed after booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm sm:text-base mb-1">Guided aurora evening (~2 h)</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">
                      Drive to darker viewing spots, enjoy hot drinks and snacks, and listen to stories about the lights and Lapland while we watch the sky.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm sm:text-base mb-1">Return to Rovaniemi</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Drop-off at your accommodation.</p>
                  </div>
                </div>
              </div>
            </div>

            <ProductFaq items={faqs} schemaId="family-nl-faq" />

            <RelatedTours
              links={[
                {
                  to: '/northern-lights-tour',
                  label: 'Guaranteed Northern Lights Tour',
                  description: 'Longer aurora hunt with a free return trip if no lights appear (see Terms).',
                },
                {
                  to: '/ranua-zoo',
                  label: 'Ranua Wildlife Park Tour',
                  description: 'A family-friendly daytime wildlife excursion from Rovaniemi.',
                },
                {
                  to: '/northern-lights-tours',
                  label: 'All Northern Lights tours',
                  description: 'Compare guaranteed and family-friendly aurora experiences.',
                },
              ]}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-28">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Book Your Tour</h2>
                <BookingForm
                  tourId={8}
                  tourName="Family-Friendly Northern Lights Tour"
                  adultPrice={79}
                  childPrice={59}
                  maxCapacity={16}
                  seasonStart="09-15"
                  seasonEnd="04-15"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-luxury font-bold text-white mb-6 sm:mb-8 text-center bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            Family Aurora Gallery
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[
              { src: '/lights4.jpg', alt: 'Soft green Northern Lights above Lapland trees on a family aurora evening' },
              { src: '/lights6.jpg', alt: 'Aurora Borealis over snow near Rovaniemi during a short family tour' },
              { src: '/lights1.jpg', alt: 'Colourful Northern Lights display in Finnish Lapland winter sky' },
              { src: '/lights5.jpg', alt: 'Aurora hunting night sky with snowy Arctic landscape near Rovaniemi' },
            ].map(({ src, alt }) => (
              <div
                key={src}
                className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FamilyFriendlyNorthernLights;
