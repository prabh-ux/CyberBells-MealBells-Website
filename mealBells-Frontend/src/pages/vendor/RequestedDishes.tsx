import React from "react";

const dishes = [
  {
    id: 1,
    name: "Alex Johnson",
    initials: "AJ",
    avatarBg: "bg-gray-700",
    date: "Oct 24, 2024",
    type: "VEG",
    typeColor: "text-green-600 bg-green-50",
    dish: "Mediterranean Falafel Wrap",
    description: "Extra tahini sauce, whole wheat tortilla",
  },
  {
    id: 2,
    name: "Sarah Miller",
    initials: "SM",
    avatarBg: "bg-amber-800",
    date: "Oct 23, 2024",
    type: "NON-VEG",
    typeColor: "text-red-500 bg-red-50",
    dish: "Grilled Teriyaki Salmon Bowl",
    description: "Brown rice, steamed broccoli, ginger",
  },
  {
    id: 3,
    name: "James David",
    initials: "JD",
    avatarBg: "bg-orange-400",
    date: "Oct 22, 2024",
    type: "VEG",
    typeColor: "text-green-600 bg-green-50",
    dish: "Truffle Mushroom Risotto",
    description: "Portobello mushrooms, parmesan cheese",
  },
];

const RequestedDishes = () => {
  return (
    <div className="min-h-screen  p-8 flex justify-center items-start">
      <div className="w-full max-w-7xl rounded-2xl shadow-sm p-6">
        <div className=" flex justify-between">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              Curated for you
            </h2>
            <p className="text-md text-gray-500 mb-5">
              Review and approve employee meal requests to build next week's
              menu.
            </p>
          </div>
          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              By Day
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              By Category
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              By Popularity
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Dish Cards */}
        <div className="space-y-6">
          {dishes.map((item) => (
            <div key={item.id} className="flex flex-col gap-3">
              {/* User Info Row */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${item.avatarBg} flex items-center justify-center text-white text-sm font-semibold overflow-hidden`}
                >
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.typeColor}`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Requested {item.date}</p>
                </div>
              </div>

              {/* Dish Details */}
              <div className="pl-0">
                <h4 className="text-base font-bold text-gray-900 mb-0.5">
                  {item.dish}
                </h4>
                <p className="text-sm text-gray-500 mb-3">{item.description}</p>

                {/* Actions */}
                {/* Actions */}
<div className="flex items-center gap-3 w-full">
  <button className="flex-[3] py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm text-center">
    Accept
  </button>
  <button className="flex-1 py-3.5 text-sm font-semibold text-black  bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-center">
    Ignore
  </button>
</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RequestedDishes;
