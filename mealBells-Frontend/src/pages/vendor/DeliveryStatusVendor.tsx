import React from 'react';
import { 
  Check, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  RefreshCw, 
  ChevronDown 
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Preparing',
    subtitle: 'Completed at 11:45 AM',
    status: 'completed',
  },
  {
    id: 2,
    title: 'Packed',
    subtitle: 'Completed at 12:10 PM',
    status: 'completed',
  },
  {
    id: 3,
    title: 'Out For Delivery',
    subtitle: 'Est. Arrival in 8 mins',
    status: 'current',
  },
  {
    id: 4,
    title: 'Arrived at Office',
    subtitle: '',
    status: 'pending',
  },
  {
    id: 5,
    title: 'Handed Over',
    subtitle: '',
    status: 'pending',
  },
];

const DeliveryStatusVendor = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-start">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-lg overflow-hidden">
        
        {/* Order Reference */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Order Reference
          </p>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-900">Order #1234</h2>
            <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full uppercase tracking-wide">
              Priority
            </span>
          </div>
          <p className="text-sm text-gray-500">Destination: Office Main Lobby</p>
        </div>

        {/* Live Progress */}
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Live Progress
          </p>
          
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[15px] top-3 bottom-12 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-4 relative">
                  {/* Status Circle */}
                  <div className={`
                    relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${step.status === 'completed' ? 'bg-orange-500' : ''}
                    ${step.status === 'current' ? 'bg-orange-500 ring-4 ring-orange-100' : ''}
                    ${step.status === 'pending' ? 'bg-white border-2 border-gray-200' : ''}
                  `}>
                    {step.status === 'completed' && (
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    )}
                    {step.status === 'current' && (
                      <Clock className="w-4 h-4 text-white" strokeWidth={2} />
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="pt-1">
                    <h3 className={`
                      text-sm font-semibold
                      ${step.status === 'current' ? 'text-orange-500' : 'text-gray-900'}
                    `}>
                      {step.title}
                    </h3>
                    {step.subtitle && (
                      <p className="text-xs text-gray-400 mt-0.5">{step.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map & Driver */}
        <div className="px-5 pb-5">
          <div className="relative h-94 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            {/* Map background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"></div>
            
            {/* Route line */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 176" preserveAspectRatio="none">
              <path 
                d="M 80 150 Q 150 110 200 90 T 320 50" 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeDasharray="6 4"
              />
            </svg>
            
            {/* Map Pin */}
            <div className="absolute top-10 right-24">
              <MapPin className="w-10 h-10 text-orange-500 drop-shadow-lg" fill="currentColor" />
            </div>

            {/* Driver Card */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
                  MR
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Marcus Rodriguez</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <p className="text-xs text-gray-500">On the way</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Phone className="w-4 h-4 text-gray-600" />
                </button>
                <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Update Status Button */}
        <div className="p-5 pt-0">
          <button className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
            Update Status
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeliveryStatusVendor;